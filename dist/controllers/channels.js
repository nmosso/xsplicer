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
    replaceLastN: 3,
    // si append, cuantos segundos máximos totales de ads inyectar (por seguridad)
    maxAdDurationSeconds: 30,
    // Si true, inyecta una línea de discontinuidad para separar contenido
    addDiscontinuity: true,
};
class Channels {
    /**
     * Inject ads with "sliding + consumption" behaviour described by the user.
     * - adSegments: array [{uri, duration, title?}] (uri should be path like /ads/...)
     * - options.originPrefix defaults to '/fre/' to identify origin segments
     * - options.addDiscontinuity true/false (recommended true)
     */
    static injectAdsSlidingExact(originalText, adSegments, options = {}) {
        var _b;
        const addDiscontinuity = (_b = options.addDiscontinuity) !== null && _b !== void 0 ? _b : true;
        const lines = originalText.split(/\r?\n/);
        // Recopilamos todos los chunks del playlist
        const chunks = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
                let j = i + 1;
                while (j < lines.length && (lines[j].startsWith('#') || lines[j].trim() === ''))
                    j++;
                if (j < lines.length) {
                    chunks.push({ extinfIdx: i, uriIdx: j, uri: lines[j].trim() });
                }
            }
        }
        // Caso primer request: guardar último segmento y su índice
        if (!this.lastAdSegment) {
            const lastChunk = chunks[chunks.length - 1];
            this.lastAdSegment = lastChunk.uri;
            this.lastSegmentIndex = chunks.length; // posición N para el cálculo de los ads
            // Retornamos playlist original con primer chunk + ads (elimino resto)
            const firstChunk = chunks[0];
            const result = lines.slice(0, firstChunk.extinfIdx); // cabecera
            if (addDiscontinuity)
                result.push('#EXT-X-DISCONTINUITY');
            for (const seg of adSegments) {
                result.push(`#EXTINF:${seg.duration.toFixed(3)},${seg.title || ''}`);
                result.push(seg.uri);
            }
            if (addDiscontinuity)
                result.push('#EXT-X-DISCONTINUITY');
            // agregar el primer chunk original
            result.push(lines[firstChunk.extinfIdx]);
            result.push(lines[firstChunk.uriIdx]);
            return result.join('\n');
        }
        // Verificar si lastAdSegment sigue presente
        const lastIdx = chunks.findIndex(c => c.uri === this.lastAdSegment);
        if (lastIdx === -1) {
            // ciclo terminado, limpiamos estado y retornamos original
            this.lastAdSegment = '';
            this.lastSegmentIndex = -1;
            return originalText;
        }
        // Determinar cuántos ads poner según posición
        const N = lastIdx + 1; // posición 1-based
        const adsToInsert = adSegments.slice(adSegments.length - N);
        // Construir nuevo playlist
        const result = [];
        // cabecera
        const firstChunk = chunks[0];
        result.push(...lines.slice(0, firstChunk.extinfIdx));
        // insertar ads
        if (adsToInsert.length > 0) {
            if (addDiscontinuity)
                result.push('#EXT-X-DISCONTINUITY');
            for (const seg of adsToInsert) {
                result.push(`#EXTINF:${seg.duration.toFixed(3)},${seg.title || ''}`);
                result.push(seg.uri);
            }
            if (addDiscontinuity)
                result.push('#EXT-X-DISCONTINUITY');
        }
        // agregar chunks originales
        for (const c of chunks) {
            result.push(lines[c.extinfIdx]);
            result.push(lines[c.uriIdx]);
        }
        // Si N === 1 -> ciclo terminado
        if (N === 1) {
            this.lastAdSegment = '';
            this.lastSegmentIndex = -1;
        }
        return result.join('\n');
    }
}
_a = Channels;
Channels.runAd = false;
// State (dentro de la misma clase)
Channels.lastAdSegment = '';
Channels.adCycleCounter = 0;
Channels.lastSegmentIndex = -1;
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
    const newLine = "#EXT-X-DISCONTINUITY";
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            lines.splice(i, 0, newLine);
            break;
        }
    }
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
 * Insert ads after the saved last origin segment. If lastAdSegment is empty,
 * grab the last origin segment from this playlist and set it, then inject.
 *
 * Behaviour:
 * - If lastAdSegment === '' -> set it to current last origin segment and inject ads after it.
 * - Else if lastAdSegment found in current playlist -> inject ads after that segment.
 * - Else -> lastAdSegment disappeared -> clear it and return original playlist unchanged.
 */
Channels.injectAdsBeforeRawPlaylist = (originalText, adSegments, options = {}) => {
    const originPrefix = options.originPrefix || '/fre/';
    const lines = originalText.split(/\r?\n/);
    // Helper: find all URIs that belong to originPrefix and their line indexes
    const originUris = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            // next non-comment non-empty line is the URI
            let j = i + 1;
            while (j < lines.length && (lines[j].startsWith('#') || lines[j].trim() === ''))
                j++;
            if (j < lines.length) {
                const uri = lines[j].trim();
                if (uri.includes(originPrefix)) {
                    originUris.push({ uri, uriLineIdx: j, extinfLineIdx: i });
                }
            }
        }
    }
    // If no origin segments found -> nothing to do
    if (originUris.length === 0) {
        return originalText;
    }
    // Determine current last origin segment in this playlist
    const currentLastOrigin = originUris[originUris.length - 1].uri;
    // If we don't have a saved lastAdSegment yet -> set it to currentLastOrigin
    if (!_a.lastAdSegment) {
        _a.lastAdSegment = currentLastOrigin;
    }
    // Check if saved lastAdSegment appears in current playlist
    const foundIndex = originUris.findIndex(o => o.uri === _a.lastAdSegment);
    if (foundIndex === -1) {
        // saved segment no longer exists -> clear saved and return original (no injection)
        _a.lastAdSegment = '';
        return originalText;
    }
    // Determine insertion position: after the URI line of the saved segment
    const target = originUris[foundIndex];
    let insertPos = target.uriLineIdx + 1; // insert after the URI line
    // Safety: if ads are already present immediately after insertPos (avoid double-inject)
    // check a few lines ahead for an ad uri pattern (e.g., '/ads/' or presence of EXT-X-DISCONTINUITY then ads)
    const alreadyHasAds = (() => {
        const lookAhead = 6; // check next up to 6 lines for the first ad uri
        for (let k = 0; k < lookAhead && (insertPos + k) < lines.length; k++) {
            const l = lines[insertPos + k].trim();
            if (l === '#EXT-X-DISCONTINUITY')
                return true;
            if (l.startsWith('#EXTINF')) {
                // next non-comment line might be uri
                let m = insertPos + k + 1;
                while (m < lines.length && (lines[m].startsWith('#') || lines[m].trim() === ''))
                    m++;
                if (m < lines.length && lines[m].includes('/ads/'))
                    return true;
            }
            if (l.includes('/ads/'))
                return true;
        }
        return false;
    })();
    if (alreadyHasAds) {
        // Ads already inserted here -> return modified playlist but also ensure lastAdSegment persists
        return originalText;
    }
    // Build new lines: pre = up to insertPos-1, post = from insertPos...
    const pre = lines.slice(0, insertPos);
    const post = lines.slice(insertPos);
    // Prepare ad block lines
    const adLines = [];
    if (options.addDiscontinuity)
        adLines.push('#EXT-X-DISCONTINUITY');
    for (const seg of adSegments) {
        // Ensure duration is in seconds (EXTINF expects seconds). If seg.duration looks very large assume ms.
        let durSeconds = seg.duration;
        if (durSeconds > 10000)
            durSeconds = durSeconds / 1000; // heuristic: if >10s as int maybe ms
        adLines.push(`#EXTINF:${durSeconds.toFixed(3)},${seg.title || ''}`);
        adLines.push(seg.uri);
    }
    if (options.addDiscontinuity)
        adLines.push('#EXT-X-DISCONTINUITY');
    // New playlist: pre + adLines + post
    const resultLines = [...pre, ...adLines, ...post];
    return resultLines.join('\n');
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
        // Primero reemplazamos /fre/ por /frx/ en paths relativos
        let patched = _a.patchHlsPaths(originText);
        console.log('Master playlist detected, proxying without ad insertion');
        console.log(originText, ' => Patched master playlist to :', patched);
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
        // no ads found, just proxy origin but strip hosts
        let proxied = originText.replace(/\/fre\//g, '/frx/');
        proxied = _a.stripAbsoluteUrlsToPaths(proxied);
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(proxied);
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
            let injectedText = _a.injectAdsBeforeRawPlaylist(baseText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
            injectedText = _a.patchHlsPaths(injectedText);
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(injectedText);
        }
        else {
            // fallback to append
            let injectedText = _a.injectAdsIntoRawPlaylist(originText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
            injectedText = _a.patchHlsPaths(injectedText);
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(injectedText);
        }
    }
    else {
        // ---- APPEND MODE: inject ads at the beginning of the playlist ----
        console.log('Appending ads to playlist');
        // 1. Limit ad list by max duration
        let total = 0;
        const limitedAds = [];
        for (const s of chosenAds) {
            if ((total + s.duration) > CONFIG.maxAdDurationSeconds)
                break;
            limitedAds.push(s);
            total += s.duration;
        }
        let startTime = Date.now();
        console.log(`Start Time:`, startTime, ' total:', total * 1000);
        let injectedText = '';
        if (_a.isWithinEvenMinuteInterval(startTime, total * 1000)) {
            // 2. Inject limited ads at the beginning of the playlist
            _a.runAd = false;
            injectedText = _a.injectAdsSlidingExact(originText, limitedAds, {
                addDiscontinuity: CONFIG.addDiscontinuity,
                //position: 'start'  // opcional si tu función lo soporta
            });
        }
        else {
            _a.runAd = true;
            //injectedText = this.stripAbsoluteUrlsToPaths(originText);
            injectedText = _a.injectAdsIntoRawPlaylist(originText, [], {
                addDiscontinuity: false,
                position: 'start' // opcional si tu función lo soporta
            });
            console.log('Not within even minute interval, skipping ad injection');
        }
        // 3. Replace /fre/ -> /frx/ and strip absolute URLs (leave only paths)
        injectedText = _a.patchHlsPaths(injectedText);
        injectedText = _a.stripAbsoluteUrlsToPaths(injectedText);
        console.log(`Injected ${limitedAds.length} ad segments, total duration ${total.toFixed(2)}s`);
        console.log('Final injected playlist:', injectedText);
        // 3. Return modified playlist
        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(injectedText);
    }
});
// Función para obtener el inicio del minuto par más cercano
Channels.getEvenMinuteStartTime = (timestamp) => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    const evenMinute = minutes % 2 === 0 ? minutes : minutes - 1;
    date.setMinutes(evenMinute, 0, 0); // Establece segundos y milisegundos a 0
    return date.getTime();
};
// Función para verificar si el tiempo está dentro del intervalo de ±5 segundos del minuto par
Channels.isWithinEvenMinuteInterval = (timestamp, endInterval = 300000) => {
    const evenMinuteStart = _a.getEvenMinuteStartTime(timestamp);
    const lowerBound = evenMinuteStart; // 2.5 segundos antes
    const upperBound = evenMinuteStart + endInterval; // 2.5 segundos después
    console.log(`Actual Time: ${new Date(timestamp).toISOString()}`);
    console.log(`Even minute: ${new Date(evenMinuteStart).toISOString()}`);
    console.log(`Lower bound: ${new Date(lowerBound).toISOString()}`);
    console.log(`Upper bound: ${new Date(upperBound).toISOString()}`);
    return timestamp >= lowerBound && timestamp <= upperBound;
};
Channels.patchHlsPaths = (text) => {
    // 1️⃣ Reemplaza /fre/ por /frx/ solo en URLs que terminan en .hls
    return text.replace(/(https?:\/\/[^\/\s]+)?\/fre\/([^\s]+\.m3u8)/g, (_match, host, path) => {
        // Si hay host, lo mantenemos; sino queda solo path
        const prefix = host !== null && host !== void 0 ? host : '';
        return _a.stripAbsoluteUrlsToPaths(`${prefix}/frx/${path}`);
    });
};
Channels.stripAbsoluteUrlsToPaths = (manifestText) => {
    // Reemplaza cualquier URL absoluta (http(s)://host/...) por su path (/...)
    // Ej: "http://server/frx/chan/seg.ts?id=1" -> "/frx/chan/seg.ts?id=1"
    // Mantiene intactas las URIs relativas que ya empiezan con '/' o no.
    return manifestText.replace(/https?:\/\/[^\/\s]+(\/[^\r\n]*)/g, (_m, p1) => {
        // Asegurarnos de que el path comience con '/'
        return p1.startsWith('/') ? p1 : '/' + p1;
    });
};
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
