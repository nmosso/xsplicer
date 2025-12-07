
import { Router, Request, Response } from 'express'; //Request, 
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



export default class Channels {

    private static originUrlFromRequestPath = (reqPath: string) => {
        // remap /frx/...  -> CONFIG.originBase/...
        if (!reqPath.startsWith('/frx/')) return null;
        return CONFIG.originBase + reqPath.slice('/frx'.length);
    }
    /**
     * Fetch raw text with simple error handling
     */
    private static fetchText = async (url: string) => {
        const res = await fetch(url); //, { timeout: 15000 }
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            const err = new Error(`Fetch failed ${url}: ${res.status} ${res.statusText}`);
            // err.status = res.status;
            // err.body = txt;
            throw err;
        }
        return res.text();
    }
    /**
     * Parse m3u8 with m3u8-parser and return parser object + raw lines
     */
    private static parsePlaylist = (text: string) => {
        const parser = new Parser();
        parser.push(text);
        parser.end();
        return parser; // parser.manifest will have playlists/segments
    }

    /**
     * Reconstruct a media playlist string from original raw + injected segments.
     * We'll do a conservative approach: start from original lines, and after the last media segment
     * (last #EXTINF) we'll insert ad blocks. Simpler and robust for live rolling playlists.
     *
     * adSegments: array of {uri, duration, title?}
     */
    private static injectAdsIntoRawPlaylist = (originalText: string, adSegments: any, options: any = {}) => {
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
            } else {
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
            injected.splice(insertPos, 0,
                `#EXTINF:${seg.duration.toFixed(3)},${seg.title || ''}`,
                seg.uri
            );
            insertPos += 2;
        }

        return injected.join('\n');
    }

    /**
 * Convert ad manifest (VOD) into an array of segments with absolute URIs.
 * Takes adManifestUrl (absolute) and raw text of ad manifest.
 */
    private static extractAdSegments = (adManifestUrl: string, adManifestText: string) => {
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
                if (!uri) continue;
                // Resolve relative URIs relative to adManifestUrl
                const base = new URL(adManifestUrl);
                const resolved = new URL(uri, base).toString();
                segments.push({ uri: resolved, duration });
            }
        }
        return segments;
    }

    private static parseManifest = async (req: Request, res: Response) => {

        const origUrl = this.originUrlFromRequestPath(req.path);
        if (!origUrl) return res.status(400).send('Bad path');

        // Forward query string if present
        const fullOriginUrl = req.url.includes('?') ? origUrl + req.url.slice(req.path.length) : origUrl;

        // Fetch origin playlist
        const originText = await this.fetchText(fullOriginUrl);

        // Quick check: if origin is master playlist (contains EXT-X-STREAM-INF), proxy raw
        // if (/EXT-X-STREAM-INF/.test(originText)) {
        //     // Master playlist -> don't inject ads here (we inject into media playlists)
        //     res.set('Content-Type', 'application/vnd.apple.mpegurl');
        //     return res.send(originText);
        // }
        if (/EXT-X-STREAM-INF/.test(originText)) {
            // Reemplazar solo en URLs, no en todo el archivo
            

            // Primero reemplazamos /fre/ por /frx/ en paths relativos
            let patched = this.patchHlsPaths(originText);
            console.log('Master playlist detected, proxying without ad insertion');
            console.log(originText, ' => Patched master playlist to :',patched);
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(patched);
        } else {
            console.log('Media playlist detected, proceeding with ad insertion');
        }

        // origin is a media playlist. We'll fetch ad manifest, parse and inject.
        const adText = await this.fetchText(CONFIG.adManifestUrl);
        const adSegments = this.extractAdSegments(CONFIG.adManifestUrl, adText);
        console.log(`Extracted ${adSegments.length} ad segments from ad manifest`);

        if (!adSegments || adSegments.length === 0) {
            // no ads found, just proxy origin but strip hosts
            let proxied = originText.replace(/\/fre\//g, '/frx/');
            proxied = this.stripAbsoluteUrlsToPaths(proxied);
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
                if (originLines[i].startsWith('#EXTINF')) extinfIndexes.push(i);
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
                let injectedText = this.injectAdsIntoRawPlaylist(baseText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
                injectedText = this.patchHlsPaths(injectedText);
                res.set('Content-Type', 'application/vnd.apple.mpegurl');
                return res.send(injectedText);
            } else {
                // fallback to append
                let injectedText = this.injectAdsIntoRawPlaylist(originText, chosenAds, { addDiscontinuity: CONFIG.addDiscontinuity });
                injectedText = this.patchHlsPaths(injectedText);
                res.set('Content-Type', 'application/vnd.apple.mpegurl');
                return res.send(injectedText);
            }
        } else {
            // ---- APPEND MODE: inject ads at the beginning of the playlist ----
            console.log('Appending ads to playlist');

            // 1. Limit ad list by max duration
            let total = 0;
            const limitedAds = [];

            for (const s of chosenAds) {
                if ((total + s.duration) > CONFIG.maxAdDurationSeconds) break;
                limitedAds.push(s);
                total += s.duration;
            }

            // 2. Inject limited ads at the beginning of the playlist
            let injectedText = this.injectAdsIntoRawPlaylist(
                originText,
                limitedAds,
                {
                    addDiscontinuity: CONFIG.addDiscontinuity,
                    position: 'start'  // opcional si tu función lo soporta
                }
            );
            // 3. Replace /fre/ -> /frx/ and strip absolute URLs (leave only paths)
            injectedText = this.patchHlsPaths(injectedText);
            
            console.log(`Injected ${limitedAds.length} ad segments, total duration ${total.toFixed(2)}s`);
            console.log('Final injected playlist:', injectedText);
            
            // 3. Return modified playlist
            res.set('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(injectedText);
        }

    }
    private static patchHlsPaths = (text: string) => {
        // 1️⃣ Reemplaza /fre/ por /frx/ solo en URLs que terminan en .hls
        return text.replace(/(https?:\/\/[^\/\s]+)?\/fre\/([^\s]+\.m3u8)/g, (_match, host, path) => {
            // Si hay host, lo mantenemos; sino queda solo path
            const prefix = host ?? '';
            return this.stripAbsoluteUrlsToPaths(`${prefix}/frx/${path}`);
        });
    }
    private static stripAbsoluteUrlsToPaths = (manifestText: string) => {
        // Reemplaza cualquier URL absoluta (http(s)://host/...) por su path (/...)
        // Ej: "http://server/frx/chan/seg.ts?id=1" -> "/frx/chan/seg.ts?id=1"
        // Mantiene intactas las URIs relativas que ya empiezan con '/' o no.
        return manifestText.replace(/https?:\/\/[^\/\s]+(\/[^\r\n]*)/g, (_m, p1) => {
            // Asegurarnos de que el path comience con '/'
            return p1.startsWith('/') ? p1 : '/' + p1;
        });
    };

    public static ssai = async (req: Request, res: Response) => {
        //Insertamos la publicidad cada X minutos
        console.log(`SSAI Request for path: ${req.path}`);
        try {
            this.parseManifest(req, res);

        } catch (err: any) {
            console.error('Error proxying playlist', err);
            if (err.status) {
                return res.status(err.status).send(err.body || err.message);
            }
            return res.status(500).send('Internal server error');
        }


    }
}