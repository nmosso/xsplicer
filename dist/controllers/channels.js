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
}
_a = Channels;
Channels.runAd = false;
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
/**
 * Decide insertion position in a parsed m3u8 as array of lines.
 *
 * @param lines - array of manifest lines (originalText.split(/\r?\n/))
 * @param position - 'start' | 'afterLastExtinf' | 'end' | 'beforeSequence'
 * @returns numeric index in lines where to insert new lines
 */
Channels.findInsertPos = (lines, position = 'afterLastExtinf') => {
    // Normalize
    position = position || 'afterLastExtinf';
    // Helper: find first index of a line that starts with token
    const findFirstIndex = (token) => {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(token))
                return i;
        }
        return -1;
    };
    // Helper: find last index of a line that starts with token
    const findLastIndex = (token) => {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith(token))
                return i;
        }
        return -1;
    };
    // If playlist has endlist, insert before it for 'end' position
    const endlistIdx = findFirstIndex('#EXT-X-ENDLIST');
    if (position === 'end') {
        return endlistIdx !== -1 ? endlistIdx : lines.length;
    }
    if (position === 'start') {
        // Insert before first #EXTINF (i.e. after header tags)
        const firstExtinf = findFirstIndex('#EXTINF');
        if (firstExtinf !== -1) {
            return firstExtinf; // insert just before the first EXTINF
        }
        // If no EXTINF found, insert after header (after #EXTM3U) or at top
        const headerIdx = findFirstIndex('#EXTM3U');
        return headerIdx !== -1 ? headerIdx + 1 : 0;
    }
    if (position === 'beforeSequence') {
        // Try to insert after header but before media sequence block.
        const mediaSeqIdx = findFirstIndex('#EXT-X-MEDIA-SEQUENCE');
        const firstExtinf = findFirstIndex('#EXTINF');
        if (mediaSeqIdx !== -1 && firstExtinf !== -1) {
            // Insert at whichever comes first (usually after media-sequence tag but before first EXTINF)
            return Math.min(mediaSeqIdx + 1, firstExtinf);
        }
        // fallback to 'start' heuristic
        if (firstExtinf !== -1)
            return firstExtinf;
        const headerIdx = findFirstIndex('#EXTM3U');
        return headerIdx !== -1 ? headerIdx + 1 : 0;
    }
    // position === 'afterLastExtinf' (default)
    const lastExtinfIdx = findLastIndex('#EXTINF');
    if (lastExtinfIdx !== -1) {
        // Usually the URI of the segment is the next non-comment non-empty line after EXTINF
        let uriLineIdx = lastExtinfIdx + 1;
        while (uriLineIdx < lines.length && (lines[uriLineIdx].startsWith('#') || lines[uriLineIdx].trim() === '')) {
            uriLineIdx++;
        }
        // Insert after the URI line (i.e., at uriLineIdx + 1)
        return Math.min(uriLineIdx + 1, lines.length);
    }
    // If no EXTINF at all, fallback to 'end'
    return endlistIdx !== -1 ? endlistIdx : lines.length;
};
Channels.findInsertPosForOrigin = (lines, originPrefix, position = 'afterLastExtinf') => {
    // Si nos piden buscar por originPrefix, intentamos ubicar el último EXTINF cuya URI incluya originPrefix
    const findLastIndex = (token) => {
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith(token))
                return i;
        }
        return -1;
    };
    // Helper: obtener la URI que sigue a un EXTINF dado (saltar comentarios y líneas vacías)
    const getUriAfterExtinf = (extinfIdx) => {
        let uriLineIdx = extinfIdx + 1;
        while (uriLineIdx < lines.length && (lines[uriLineIdx].startsWith('#') || lines[uriLineIdx].trim() === '')) {
            uriLineIdx++;
        }
        return uriLineIdx < lines.length ? { uri: lines[uriLineIdx], uriLineIdx } : null;
    };
    if (originPrefix) {
        // Recorremos de atrás hacia adelante buscando un EXTINF cuya URI contenga originPrefix
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith('#EXTINF')) {
                const maybe = getUriAfterExtinf(i);
                if (maybe && maybe.uri.includes(originPrefix)) {
                    // Insertar justo después de la línea URI (i.e., en maybe.uriLineIdx + 1)
                    return Math.min(maybe.uriLineIdx + 1, lines.length);
                }
            }
        }
        // Si no encontramos ninguna EXTINF con originPrefix, caeremos al comportamiento normal
    }
    // Fallbacks: usar lógica previa según 'position'
    const endlistIdx = lines.findIndex(l => l.startsWith('#EXT-X-ENDLIST'));
    if (position === 'end')
        return endlistIdx !== -1 ? endlistIdx : lines.length;
    if (position === 'start') {
        const firstExtinf = lines.findIndex(l => l.startsWith('#EXTINF'));
        if (firstExtinf !== -1)
            return firstExtinf;
        const headerIdx = lines.findIndex(l => l.startsWith('#EXTM3U'));
        return headerIdx !== -1 ? headerIdx + 1 : 0;
    }
    if (position === 'beforeSequence') {
        const mediaSeqIdx = lines.findIndex(l => l.startsWith('#EXT-X-MEDIA-SEQUENCE'));
        const firstExtinf = lines.findIndex(l => l.startsWith('#EXTINF'));
        if (mediaSeqIdx !== -1 && firstExtinf !== -1)
            return Math.min(mediaSeqIdx + 1, firstExtinf);
        if (firstExtinf !== -1)
            return firstExtinf;
        const headerIdx = lines.findIndex(l => l.startsWith('#EXTM3U'));
        return headerIdx !== -1 ? headerIdx + 1 : 0;
    }
    // afterLastExtinf (default)
    const lastExtinfIdx = findLastIndex('#EXTINF');
    if (lastExtinfIdx !== -1) {
        const maybe = getUriAfterExtinf(lastExtinfIdx);
        if (maybe)
            return Math.min(maybe.uriLineIdx + 1, lines.length);
    }
    return endlistIdx !== -1 ? endlistIdx : lines.length;
};
Channels.injectAdsIntoRawPlaylist = (originalText, adSegments, options = {}) => {
    const lines = originalText.split(/\r?\n/);
    // Si se pasó originPrefix (ej: '/fre/' o '/frx/'), use findInsertPosForOrigin para asegurarnos de insertar
    // después del último segmento del origen. Si no, use la findInsertPos genérica.
    let insertPos;
    if (options.originPrefix) {
        insertPos = _a.findInsertPosForOrigin(lines, options.originPrefix, options.position);
    }
    else {
        insertPos = _a.findInsertPos(lines, options.position); // usa tu función existente
    }
    const injected = [...lines];
    // Insertar discontinuidad antes del bloque de ads (si no hay una discontinuidad inmediatamente antes)
    // Comprobamos la línea anterior para no duplicar discontinuidades
    const prevLineIdx = Math.max(0, insertPos - 1);
    if (!injected[prevLineIdx] || !injected[prevLineIdx].startsWith('#EXT-X-DISCONTINUITY')) {
        injected.splice(insertPos, 0, '#EXT-X-DISCONTINUITY');
        insertPos++;
    }
    // Insertar ads
    for (const seg of adSegments) {
        if (seg.programDateTime) {
            injected.splice(insertPos, 0, `#EXT-X-PROGRAM-DATE-TIME:${seg.programDateTime}`);
            insertPos++;
        }
        // duration aquí debe estar en MILISEGUNDOS? en tu código original parece ms; EXTINF espera segundos
        const durSeconds = (seg.duration && seg.duration > 10000) ? (seg.duration / 1000) : seg.duration; // ajuste heurístico si guardas ms
        injected.splice(insertPos, 0, `#EXTINF:${(durSeconds).toFixed(3)},`, seg.uri);
        insertPos += 2;
    }
    // Insertar otra discontinuidad para separar retorno al origen (si no está ya)
    if (!injected[insertPos] || !injected[insertPos].startsWith('#EXT-X-DISCONTINUITY')) {
        injected.splice(insertPos, 0, '#EXT-X-DISCONTINUITY');
        insertPos++;
    }
    return injected.join('\n');
};
// private static injectAdsIntoRawPlaylist = (originalText: string, adSegments: any, options: any = {}) => {
//     const lines = originalText.split(/\r?\n/);
//     // find last line index containing "#EXTINF"
//     let lastExtinfIndex = -1;
//     for (let i = lines.length - 1; i >= 0; i--) {
//         if (lines[i].startsWith('#EXTINF')) {
//             lastExtinfIndex = i;
//             break;
//         }
//     }
//     // If no EXTINF found, just append at end
//     let insertPos = lines.length;
//     if (lastExtinfIndex !== -1) {
//         // insert after the URI following last EXTINF (which is usually next line)
//         // find the URI line
//         if (lastExtinfIndex + 1 < lines.length) {
//             insertPos = lastExtinfIndex + 2; // after EXTINF and its URI
//         } else {
//             insertPos = lines.length;
//         }
//     }
//     const injected = [...lines];
//     if (options.addDiscontinuity) {
//         injected.splice(insertPos, 0, '#EXT-X-DISCONTINUITY');
//         insertPos++;
//     }
//     // Insert ad segments
//     for (const seg of adSegments) {
//         injected.splice(insertPos, 0,
//             `#EXTINF:${seg.duration.toFixed(3)},${seg.title || ''}`,
//             seg.uri
//         );
//         insertPos += 2;
//     }
//     return injected.join('\n');
// }
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
            let injectedText = _a.injectAdsIntoRawPlaylist(baseText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
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
            injectedText = _a.injectAdsIntoRawPlaylist(originText, limitedAds, {
                addDiscontinuity: CONFIG.addDiscontinuity,
                position: 'start' // opcional si tu función lo soporta
            });
        }
        else {
            _a.runAd = true;
            injectedText = _a.stripAbsoluteUrlsToPaths(originText);
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
    const lowerBound = evenMinuteStart - 2500; // 2.5 segundos antes
    const upperBound = evenMinuteStart + 2500 + endInterval; // 2.5 segundos después
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
