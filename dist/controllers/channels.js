"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
//const fetch = require('node-fetch');
const { Parser, Playlist } = require('m3u8-parser');
/**
* Configuración: ajustar según tu entorno
*/
const CONFIG = {
    // Base origin where live manifests live (mapped from /frx/... -> /frx_origin/...)
    originBase: 'http://loonorigin01.x1234.xyz/fre/',
    // Ad (VOD) manifest(s) — puede ser un solo manifiesto o varios rotativos
    adManifestUrl: 'http://loonorigin01.x1234.xyz/ads/cocacola/playlist.m3u8',
    // modo: 'append' (añade ads después del manifiesto actual) o 'replace_last_n' (reemplaza últimos N segmentos por ads)
    insertMode: 'replace_last_n_false',
    // si replace_last_n, cuantos segmentos del live reemplazar
    replaceLastN: 2,
    // si append, cuantos segundos máximos totales de ads inyectar (por seguridad)
    maxAdDurationSeconds: 30,
    // Si true, inyecta una línea de discontinuidad para separar contenido
    addDiscontinuity: true,
};
class Channels {
}
_a = Channels;
Channels.originUrlFromRequestPath = (reqPath) => {
    // remap /frx/...  -> CONFIG.originBase/...
    if (!reqPath.startsWith('/frx/'))
        return null;
    return CONFIG.originBase + reqPath.slice('/frx'.length);
};
/**
 * Fetch raw text with simple error handling
 */
Channels.fetchText = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(url); //, { timeout: 15000 }
    if (!res.ok) {
        const txt = yield res.text().catch(() => '');
        const err = new Error(`Fetch failed ${url}: ${res.status} ${res.statusText}`);
        // err.status = res.status;
        // err.body = txt;
        throw err;
    }
    return res.text();
});
/**
 * Parse m3u8 with m3u8-parser and return parser object + raw lines
 */
Channels.parsePlaylist = (text) => {
    const parser = new Parser();
    parser.push(text);
    parser.end();
    return parser; // parser.manifest will have playlists/segments
};
/**
 * Reconstruct a media playlist string from original raw + injected segments.
 * We'll do a conservative approach: start from original lines, and after the last media segment
 * (last #EXTINF) we'll insert ad blocks. Simpler and robust for live rolling playlists.
 *
 * adSegments: array of {uri, duration, title?}
 */
Channels.injectAdsIntoRawPlaylist = (originalText, adSegments, options = {}) => {
    const lines = originalText.split(/\r?\n/);
    // find last line index containing "#EXTINF"
    let lastExtinfIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('#EXTINF')) {
            lastExtinfIndex = i;
            break;
        }
    }
    // If no EXTINF found, just append at end
    let insertPos = lines.length;
    if (lastExtinfIndex !== -1) {
        // insert after the URI following last EXTINF (which is usually next line)
        // find the URI line
        if (lastExtinfIndex + 1 < lines.length) {
            insertPos = lastExtinfIndex + 2; // after EXTINF and its URI
        }
        else {
            insertPos = lines.length;
        }
    }
    const injected = [...lines];
    if (options.addDiscontinuity) {
        injected.splice(insertPos, 0, '#EXT-X-DISCONTINUITY');
        insertPos++;
    }
    // Insert ad segments
    for (const seg of adSegments) {
        injected.splice(insertPos, 0, `#EXTINF:${seg.duration.toFixed(3)},${seg.title || ''}`, seg.uri);
        insertPos += 2;
    }
    return injected.join('\n');
};
/**
* Convert ad manifest (VOD) into an array of segments with absolute URIs.
* Takes adManifestUrl (absolute) and raw text of ad manifest.
*/
Channels.extractAdSegments = (adManifestUrl, adManifestText) => {
    // Very simple parsing: find all EXTINF and next line is URI
    const lines = adManifestText.split(/\r?\n/);
    const segments = [];
    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i].trim();
        if (ln.startsWith('#EXTINF')) {
            const duration = parseFloat(ln.split(':')[1]) || 0;
            // next non-empty line is URI
            let uri = '';
            let j = i + 1;
            while (j < lines.length) {
                const cand = lines[j].trim();
                if (!cand.startsWith('#') && cand !== '') {
                    uri = cand;
                    break;
                }
                j++;
            }
            if (!uri)
                continue;
            // Resolve relative URIs relative to adManifestUrl
            const base = new URL(adManifestUrl);
            const resolved = new URL(uri, base).toString();
            segments.push({ uri: resolved, duration });
        }
    }
    return segments;
};
Channels.parseManifest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const origUrl = _a.originUrlFromRequestPath(req.path);
    if (!origUrl)
        return res.status(400).send('Bad path');
    // Forward query string if present
    const fullOriginUrl = req.url.includes('?') ? origUrl + req.url.slice(req.path.length) : origUrl;
    // Fetch origin playlist
    const originText = yield _a.fetchText(fullOriginUrl);
    // Quick check: if origin is master playlist (contains EXT-X-STREAM-INF), proxy raw
    // if (/EXT-X-STREAM-INF/.test(originText)) {
    //     // Master playlist -> don't inject ads here (we inject into media playlists)
    //     res.set('Content-Type', 'application/vnd.apple.mpegurl');
    //     return res.send(originText);
    // }
    if (/EXT-X-STREAM-INF/.test(originText)) {
        // Reemplazar solo en URLs, no en todo el archivo
        console.log('Master playlist detected, proxying without ad insertion');
        const patched = originText.replace(/\/fre\//g, '/frx/');
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(patched);
    }
    else {
        console.log('Media playlist detected, proceeding with ad insertion');
    }
    // origin is a media playlist. We'll fetch ad manifest, parse and inject.
    const adText = yield _a.fetchText(CONFIG.adManifestUrl);
    const adSegments = _a.extractAdSegments(CONFIG.adManifestUrl, adText);
    console.log(`Extracted ${adSegments.length} ad segments from ad manifest`);
    if (!adSegments || adSegments.length === 0) {
        // no ads found, just proxy origin
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(originText);
    }
    // Depending on mode, choose ad segments slice
    let chosenAds = [...adSegments];
    if (CONFIG.insertMode === 'replace_last_n') {
        // We'll remove last N segments from the origin playlist and splice the ad segments there.
        // To do this reliably, parse origin and find last N segment URIs and then remove them from originalText before insertion.
        const originLines = originText.split(/\r?\n/);
        // find indexes of EXTINF lines
        const extinfIndexes = [];
        for (let i = 0; i < originLines.length; i++) {
            if (originLines[i].startsWith('#EXTINF'))
                extinfIndexes.push(i);
        }
        if (extinfIndexes.length > 0) {
            const toRemove = Math.min(CONFIG.replaceLastN, extinfIndexes.length);
            // index of EXTINF to start removing
            const startRemoveExtinfIdx = extinfIndexes[extinfIndexes.length - toRemove];
            // determine line index where we start insertion: before startRemoveExtinfIdx
            const before = originLines.slice(0, startRemoveExtinfIdx);
            // create new base playlist text without the last N segments
            const baseText = before.join('\n');
            // Now inject ads into baseText (which ends just before the removed EXTINF)
            const injectedText = _a.injectAdsIntoRawPlaylist(baseText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(injectedText);
        }
        else {
            // fallback to append
            const injectedText = _a.injectAdsIntoRawPlaylist(originText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(injectedText);
        }
    }
    else {
        // append mode: limit by ad duration
        console.log('Appending ads to playlist');
        let total = 0;
        const limitedAds = [];
        for (const s of chosenAds) {
            if ((total + s.duration) > CONFIG.maxAdDurationSeconds)
                break;
            limitedAds.push(s);
            total += s.duration;
        }
        const injectedText = _a.injectAdsIntoRawPlaylist(originText, limitedAds, { addDiscontinuity: CONFIG.addDiscontinuity });
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(injectedText);
    }
});
Channels.ssai = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //Insertamos la publicidad cada X minutos
    console.log(`SSAI Request for path: ${req.path}`);
    try {
        _a.parseManifest(req, res);
    }
    catch (err) {
        console.error('Error proxying playlist', err);
        if (err.status) {
            return res.status(err.status).send(err.body || err.message);
        }
        return res.status(500).send('Internal server error');
    }
});
exports.default = Channels;
