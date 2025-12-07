"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getnoredirect = exports.head = exports.getFileExtensionFromUrl = exports.downloadFile = exports.downloadFileOld = exports.downloadImage = exports.put = exports.putHttp = exports.putAxios = exports.get = exports.post = exports.checkUser = exports.getDurationInMilliseconds = exports.siteApikey = exports.siteOpertorAuth = exports.checkApikey = exports.checkAuth = exports.checkJWT = exports.checkToken = exports.validOrigin = exports.requireAuth = exports.actualtime = exports.language = exports.country = exports.ip = exports.getHashedPassword = exports.rpl = exports.URI2Json = exports.decode64 = exports.generateAuthToken = exports.authTokens = exports.crypto = void 0;
exports.cleartext = cleartext;
exports.validtext = validtext;
exports.isNumber = isNumber;
exports.validmacadd = validmacadd;
exports.addurl = addurl;
exports.checkurl = checkurl;
const debug_1 = __importDefault(require("../base/debug"));
const superagent_1 = __importDefault(require("superagent"));
const credentials_1 = __importDefault(require("./credentials"));
const config_1 = require("../config/config");
const server_1 = __importDefault(require("../server/server"));
const pgsql_1 = __importDefault(require("../pgsql/pgsql"));
const http = require('https');
const axios_1 = __importDefault(require("axios"));
exports.crypto = require('crypto');
exports.authTokens = {};
function cleartext(msg) {
    let data = msg.replace(/[^\w]/gi, '');
    return data;
}
function validtext(msg) {
    return (msg.match(/[^\w]/gi));
}
function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); }
const generateAuthToken = () => {
    return exports.crypto.randomBytes(30).toString('hex');
};
exports.generateAuthToken = generateAuthToken;
const decode64 = (str) => Buffer.from(str, 'base64').toString('binary');
exports.decode64 = decode64;
const URI2Json = (search) => {
    let params = Object.fromEntries(new URLSearchParams(search));
    return JSON.parse(JSON.stringify(params));
};
exports.URI2Json = URI2Json;
const rpl = (str) => {
    const re1 = /'|"|\`/gi;
    if (str !== undefined)
        return str.toString().replace(re1, `´`);
    else
        return undefined;
    //return str;
    //return aux;
};
exports.rpl = rpl;
const getHashedPassword = (password) => {
    const sha256 = exports.crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
};
exports.getHashedPassword = getHashedPassword;
let ip = (req) => {
    //console.log(req.headers);
    debug_1.default.log(`ips A: ${JSON.stringify(req.headers['cf-connecting-ip'])}}`);
    debug_1.default.log(`ips B: ${JSON.stringify(req.headers['x-forwarded-for'])}}`);
    let auxip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'];
    let ip = (auxip == undefined) ? "empty" : auxip.toString();
    return ip;
};
exports.ip = ip;
let country = (req) => {
    let auxcn = req.headers['cf-ipcountry'];
    let cn = (auxcn == undefined) ? "UN" : auxcn.toString();
    return cn;
};
exports.country = country;
let language = (req) => {
    let lang = 'br';
    let auxlang = req.acceptsLanguages('pr', 'es', 'en');
    if (auxlang !== false) {
        lang = auxlang;
    }
    return lang;
};
exports.language = language;
let actualtime = (func, ip, country) => {
    let date_ob = new Date();
    let pdate = `${date_ob.getFullYear()}-${date_ob.getMonth()}-${date_ob.getDay()} ${date_ob.getHours()}:${date_ob.getMinutes()}:${date_ob.getSeconds()}`;
    debug_1.default.log(`Entering in function ${func} at ${pdate} | ip: ${ip} | Country: ${country}\n>>>>>>>>`, 1, country);
};
exports.actualtime = actualtime;
function validmacadd(msg) {
    if (msg.trim().match(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/))
        return msg.toUpperCase().trim();
    else
        return undefined;
}
const requireAuth = (req, res, next) => {
    console.log('Authorization con el Cookie!!');
    let cn = (0, exports.country)(req);
    (0, exports.actualtime)('EXCHANGE', (0, exports.ip)(req), (0, exports.country)(req));
    if (req.sessionID && req.session) {
        console.log(req.session.cookie);
        let Client = exports.authTokens[req.sessionID];
        if (Client !== undefined) {
            next();
        }
        else {
            console.log('Nos vamos pal Login!');
            res.render('login', {
                message: 'Please login to continue',
                messageClass: 'alert-danger'
            });
        }
    }
};
exports.requireAuth = requireAuth;
const validOrigin = (site) => {
    return (req, res, next) => {
        // console.log('------------------------------------------------------------------')
        // console.log('Validaton origin')
        // console.log(req);
        // console.log('------------------------------------------------------------------')
        if (!checkurl(site, req.protocol, req.get('host'), (0, exports.country)(req))) {
            debug_1.default.error('///////////////////////////////////////////////////////////////////');
            debug_1.default.error(`Error: Invalid origin request: ${req.get('host')}  not authorised.`);
            res.status(401).send('Not Authorised');
            return;
        }
        else {
            console.log(`Origin Authorised`);
            next();
        }
    };
};
exports.validOrigin = validOrigin;
function addurl(url, func, typeurl = 'degug') {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        pgsql_1.default.CUD(`addcrossurls`, '$1::varchar,$2::varchar,$3::varchar', [url, func, typeurl]).then((data) => {
            resolve({ status: "ok" });
        }).catch((err) => {
            reject(err);
        });
    }));
}
function checkurl(func, protocol, url, country) {
    let procesed = false;
    let auxurl = '';
    if (url !== undefined) {
        auxurl = url;
    }
    server_1.default.params.urls.forEach((urlinfo) => __awaiter(this, void 0, void 0, function* () {
        let funcs = urlinfo.func.split(',');
        if (funcs !== undefined) {
            yield funcs.forEach((fn) => __awaiter(this, void 0, void 0, function* () {
                if (urlinfo.func == fn) {
                    //procesed = true;
                    debug_1.default.log(`passing ${JSON.stringify(urlinfo)} in debug mode [${config_1.debugMode}] check [${auxurl}]`, 8, country);
                    /*if (protocol !== '' && urlinfo.protocol != protocol ) {
                        debug.log(`Error in protocol: ${urlinfo.protocol} not equal to ${protocol}`,4,country)
                        
                    } else {*/
                    if (!config_1.debugMode) {
                        if (urlinfo.url.indexOf(auxurl) < 0) {
                            //debug.debug(`${url} not enabled for ${func}`,4,country)
                            //debug.debug('error en la Matrix')
                        }
                        else {
                            //console.log('URL filter passed');
                            debug_1.default.log('URL Filter passed');
                            procesed = true;
                        }
                        ;
                    }
                    else {
                        if (urlinfo.urldebug.indexOf(auxurl) < 0) {
                            //debug.debug('Error en la Matrix')
                            //debug.debug(`${url} not enabled for ${func}`,4,country)
                        }
                        else {
                            //console.log('URL DEBUG filter passed');
                            debug_1.default.log('URL DEBUG Filter passed');
                            procesed = true;
                        }
                        ;
                    }
                    //}
                }
            }));
        }
    }));
    debug_1.default.log(`URL filter passed = ${procesed}`, 8, country);
    return procesed;
}
const checkToken = () => {
    return (req, res, next) => {
        debug_1.default.debug(`Checkig new Token`);
        credentials_1.default.checkToken(req).then(() => {
            next();
        }).catch((err) => {
            //console.log(`No api Key in header`);
            debug_1.default.error(err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        });
    };
};
exports.checkToken = checkToken;
const checkJWT = () => {
    return (req, res, next) => {
        debug_1.default.debug(`Checkig JWT Token`);
        credentials_1.default.checkJWT(req).then(() => {
            next();
        }).catch((err) => {
            //console.log(`No api Key in header`);
            debug_1.default.error(err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        });
    };
};
exports.checkJWT = checkJWT;
const checkAuth = () => {
    return (req, res, next) => {
        console.log(`Checkig new Auth basic or bearer`);
        console.log(req.headers);
        if (req.headers.authorization !== undefined && req.headers.authorization.indexOf('Basic ') > -1) {
            console.log(`Accessing with basic`);
            credentials_1.default.checkAuth(req).then(() => {
                next();
            }).catch((err) => {
                //console.log(`No api Key in header`);
                debug_1.default.error(err);
                res.status(err.status).send({ status: "error", message: err.message });
                return;
            });
        }
        else if (req.headers.authorization !== undefined && req.headers.authorization.indexOf('Bearer ') > -1) {
            console.log(`Accessing with JWT auth Bearer`);
            credentials_1.default.checkJWT(req).then(() => {
                next();
            }).catch((err) => {
                //console.log(`No api Key in header`);
                debug_1.default.error(err);
                res.status(err.status).send({ status: "error", message: err.message });
                return;
            });
        }
        else {
            res.status(401).send('Missing Authorization Header');
        }
    };
};
exports.checkAuth = checkAuth;
const checkApikey = () => {
    return (req, res, next) => {
        debug_1.default.debug(`Checkig new Auth`);
        credentials_1.default.checkApikey(req).then(() => {
            next();
        }).catch((err) => {
            //console.log(`No api Key in header`);
            debug_1.default.error(err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        });
    };
};
exports.checkApikey = checkApikey;
const siteOpertorAuth = () => {
    return (req, res, next) => {
        debug_1.default.debug(`Checkig new Auth site Operator`);
        credentials_1.default.checkOperatorAuth(req).then(() => {
            console.log(`Auth Passed`);
            next();
        }).catch((err) => {
            console.log(`No autorizatipon granted`);
            console.log('Error:', err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        });
    };
};
exports.siteOpertorAuth = siteOpertorAuth;
const siteApikey = () => {
    return (req, res, next) => {
        debug_1.default.debug(`Checkig new Auth site API KEY`);
        credentials_1.default.siteApikey(req).then(() => {
            next();
        }).catch((err) => {
            //console.log(`No api Key in header`);
            debug_1.default.error(err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        });
    };
};
exports.siteApikey = siteApikey;
const getDurationInMilliseconds = (start) => {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e6;
    const diff = process.hrtime(start);
    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};
exports.getDurationInMilliseconds = getDurationInMilliseconds;
const checkUser = () => {
    return (req, res, next) => {
        console.log(`Checkig new Auth`);
        credentials_1.default.checkUser(req).then(() => {
            console.log(`User Auth Passed`);
            next();
        }).catch((err) => {
            console.log(`Error un checkUser`);
            console.log(err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        });
    };
};
exports.checkUser = checkUser;
const post = (url, headers, params) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        superagent_1.default
            .post(url)
            .send(JSON.stringify(params))
            .set(headers)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .then((res) => {
            //console.log('Response')
            //console.log(res.body);
            resolve(res.body);
        })
            .catch((err) => {
            console.log('Error en POST:');
            let errmsg = { status: err.errno, err };
            reject(errmsg);
        });
    }));
};
exports.post = post;
const get = (url, headers) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        superagent_1.default
            .get(url)
            .timeout({
            response: 5000, // Wait 5 seconds for the server to start sending,
            deadline: 60000, // but allow 1 minute for the file to finish loading.
        })
            .buffer(false)
            .set(headers)
            .set('Accept', 'application/json')
            .then((res) => {
            //console.log(`GET Response from ${url} `)
            //console.log(res.body);
            resolve(res.body);
        })
            .catch((err) => {
            console.log(`Error en GET: ${url}`);
            console.error('Detalles del error:', err);
            let errmsg = { status: err.status, message: JSON.stringify(err) };
            reject(errmsg);
        });
    }));
};
exports.get = get;
const putAxios = (url, extraHeaders, params) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        // 1) Serializar el body explícitamente para controlar exactamente lo que se envía
        const bodyStr = JSON.stringify(params);
        // 2) Construir headers y forzar Content-Length (evita chunked transfer)
        const headers = Object.assign({ 
            //'Content-Type': 'application/json',
            //'Content-Length': Buffer.byteLength(bodyStr).toString(),
            'User-Agent': 'Mozilla/5.0 (compatible; DebugAxios/1.0)' }, extraHeaders);
        // 3) Opciones axios (maxBodyLength evita errores en cuerpos grandes)
        const axiosConfig = {
            method: 'put',
            url,
            data: bodyStr,
            headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000,
            // Si necesitas usar proxy local (mitmproxy) habilita esto:
            // proxy: { host: '127.0.0.1', port: 8080 }
            // o process.env.HTTP_PROXY = 'http://127.0.0.1:8080';
        };
        // 4) Interceptor para mostrar config antes de enviar
        const reqInterceptor = axios_1.default.interceptors.request.use(cfg => {
            console.log('--- AXIOS REQUEST CONFIG ---');
            console.log('url:', cfg.url);
            console.log('method:', cfg.method);
            console.log('headers:', cfg.headers);
            console.log('body (first 1000 chars):', (cfg.data || '').toString().slice(0, 1000));
            return cfg;
        });
        try {
            const res = yield (0, axios_1.default)(axiosConfig);
            console.log('--- AXIOS RESPONSE ---');
            console.log('status:', res.status);
            console.log('response headers:', res.headers);
            // En Node, axios expone el objeto raw de la respuesta en res.request/res.connection.
            // Intentamos imprimir información del request/response de bajo nivel:
            try {
                const rawReq = res.request; // puede ser IncomingMessage o ClientRequest segun versión
                if (rawReq) {
                    console.log('raw request object keys:', Object.keys(rawReq).slice(0, 50));
                    if (typeof rawReq.getHeaders === 'function') {
                        console.log('raw request sent headers (getHeaders):', rawReq.getHeaders());
                    }
                    // Algunos objetos exponen _header con el bloque completo a enviar
                    if (rawReq._header) {
                        console.log('raw request header block (first 1000 chars):', rawReq._header.slice(0, 1000));
                    }
                }
            }
            catch (e) {
                console.log('no pude leer raw request details:', e);
            }
            axios_1.default.interceptors.request.eject(reqInterceptor);
            return res.data;
        }
        catch (err) {
            axios_1.default.interceptors.request.eject(reqInterceptor);
            console.log('--- AXIOS ERROR ---');
            if (err.response) {
                // servidor respondió con status >= 400
                console.log('status:', err.response.status);
                console.log('response headers:', err.response.headers);
                console.log('response body:', err.response.data);
            }
            else if (err.request) {
                // petición fue hecha pero no hubo respuesta (timeout, socket err, etc)
                console.log('no response, err.request keys:', Object.keys(err.request).slice(0, 50));
                // intentar extraer headers enviados por el objeto request
                try {
                    if (typeof err.request.getHeaders === 'function') {
                        console.log('request.getHeaders():', err.request.getHeaders());
                    }
                    if (err.request._header) {
                        console.log('request._header (first 1000 chars):', err.request._header.slice(0, 1000));
                    }
                }
                catch (e) {
                    console.log('no pude leer err.request internals:', e);
                }
                console.log('err.code:', err.code);
            }
            else {
                // algo falló construyendo la petición
                console.log('error message:', err.message);
            }
            throw err;
        }
    }));
};
exports.putAxios = putAxios;
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
const putHttp = (url, headers, params) => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new url_1.URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https_1.default : http;
            const data = JSON.stringify(params);
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'PUT',
                headers: Object.assign({ 'Content-Length': Buffer.byteLength(data) }, headers),
            };
            const req = client.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body || '{}');
                        resolve(json);
                    }
                    catch (err) {
                        resolve(body); // por si no es JSON válido
                    }
                });
            });
            req.on('error', (err) => {
                console.error('Error en PUT:', err);
                reject({ status: err.errno || -1, err });
            });
            req.write(data);
            req.end();
        }
        catch (err) {
            reject({ status: err.errno || -1, err });
        }
    });
};
exports.putHttp = putHttp;
const put = (url, headers, params) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const bodyStr = JSON.stringify(params);
        const req = superagent_1.default
            .put(url)
            .set(headers)
            .set('Content-Length', Buffer.byteLength(bodyStr).toString())
            //.set('Accept', 'application/json, text/plain, */*')
            //.set('Content-Type', 'application/json')
            .send(params)
            .then((res) => {
            //console.log('Response')
            //console.log(res.body);
            resolve(res.body);
        })
            .catch((err) => {
            console.log('Error en PUT:');
            let errmsg = { status: err.errno, err };
            reject(errmsg);
        });
        // req.on('request', (r:any) => {
        //     console.log('--- REQUEST (socket layer) ---');
        //     try {
        //         // node >= v10: r.getHeaders()
        //         console.log('method:', r.method);
        //         console.log('path:', r.path || r.path);
        //         console.log('host:', r.host || r.getHeader && r.getHeader('host'));
        //         if (typeof r.getHeaders === 'function') {
        //             console.log('raw headers:', r.getHeaders());
        //         } else {
        //             console.log('raw headers (fallback):', r._headers || r.headers);
        //         }
        //     } catch (e) { console.log('err printing request:', e); }
        // });
        // // evento: cuando llega la respuesta
        // req.on('response', (res:any) => {
        //     console.log('--- RESPONSE HEADERS ---');
        //     console.log('status:', res.statusCode);
        //     console.log(res.headers);
        // });
    }));
};
exports.put = put;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Descarga una imagen y la guarda en un directorio específico.
 *
 * @param url La URL de la imagen a descargar.
 * @param savePath La ruta del directorio donde se guardará la imagen.
 * @param fileName El nombre con el que se guardará la imagen.
 */
/*
export const  downloadImage = async (url: string, savePath: string, fileName: string) => {
    try {
        const res = await superagent.get(url).responseType('blob');
        const fullPath = path.join(savePath, fileName);
        fs.writeFileSync(fullPath, res.body);
        console.log(`Imagen guardada en: ${fullPath}`);
    } catch (error) {
        console.error(`Error al descargar la imagen: ${error}`);
    }
} */
/*
export const downloadImage = async (url: string, fullPath: string) => {
    try {
        if (fs.existsSync(fullPath)) {
            console.log(`La imagen ya existe en: ${fullPath}`);
            return;
        }
        const res = await superagent.get(url).responseType('blob');
        fs.writeFileSync(fullPath, res.body);
        console.log(`Imagen guardada en: ${fullPath}`);
    } catch (error) {
        console.error(`Error al descargar la imagen: ${error}`);
    }
}*/
/**
 * Descarga una imagen y la guarda en un directorio específico.
 *
 * @param url La URL de la imagen a descargar.
 * @param savePath La ruta del directorio donde se guardará la imagen.
 * @param fileName El nombre con el que se guardará la imagen.
 */
const downloadImage = (url, savePath, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield superagent_1.default.get(url).responseType('blob');
        const fullPath = path.join(savePath, fileName);
        fs.writeFileSync(fullPath, res.body);
        //console.log(`Imagen guardada en: ${fullPath}`);
    }
    catch (error) {
        console.error(`Error al descargar la imagen: ${error} => ${url} => ${fileName}`);
    }
});
exports.downloadImage = downloadImage;
const downloadFileOld = (url, savePath, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const res = yield superagent_1.default.get(url).responseType('blob');
            const fullPath = path.join(savePath, fileName);
            fs.writeFileSync(fullPath, res.body);
            resolve({ fullPath });
        }
        catch (error) {
            console.error(`Error al descargar la imagen: ${error}`);
            reject(error);
        }
    }));
});
exports.downloadFileOld = downloadFileOld;
//function downloadFile(url, outputPath) {
const downloadFile = (url, outputPath) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                console.log(`Creatin dir ${dir}`);
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Directorio creado: ${dir}`);
            }
            const file = fs.createWriteStream(outputPath);
            console.log(`Start download:${url} => ${outputPath}`);
            http.get(url, (response) => {
                if (response.statusCode !== 200) {
                    console.error(`Error al descargar archivo. Código de estado: ${response.statusCode}`);
                    response.resume(); // Consume el response para liberar el recurso.
                    reject({ status: 'Not found' });
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => console.log("Descarga completada."));
                    resolve({ outputPath });
                });
            }).on('error', (err) => {
                fs.unlink(outputPath, () => console.error("Error al descargar archivo:", err)); // Elimina el archivo si hay un error.
                reject(err);
            });
        }
        catch (err) {
            console.log(`Error after Try`);
            reject(err);
        }
    }));
});
exports.downloadFile = downloadFile;
const getFileExtensionFromUrl = (url) => {
    // Extraer el nombre del archivo de la URL
    const fileName = url.split('/').pop();
    // Verificar si el nombre del archivo contiene un punto
    if (fileName && fileName.includes('.')) {
        // Retornar la parte de la extensión del nombre del archivo
        return fileName.split('.').pop() || '';
    }
    return '';
};
exports.getFileExtensionFromUrl = getFileExtensionFromUrl;
const head = (url, headers) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        superagent_1.default
            .head(url)
            .set(headers)
            .set('Accept', 'application/json')
            .then((res) => {
            //console.log(`GET Response from ${url} `)
            //console.log(res.body);
            resolve(res);
        })
            .catch((err) => {
            console.log(`Error en HEAD [${err.status}]: ${url}`);
            let errmsg = { status: err.status, message: JSON.stringify(err) };
            reject({ error: true, errcode: err.status });
        });
    }));
};
exports.head = head;
const getnoredirect = (url, host, ip) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        superagent_1.default
            .get(url)
            .set('Host', host)
            .set('X-Forwarded-For', ip)
            .redirects(0)
            .then((res) => {
            reject('Response non a redirect');
        })
            .catch((err) => {
            //console.log('Error en get no redirect:', err);
            console.log('-----------------------------------------------------------');
            console.log(err.status);
            if (err.status == '302') {
                console.log(err.response.res.rawHeaders[1]);
                let rsp = { http_session_url: err.response.res.rawHeaders[1], address: host };
                resolve(rsp);
            }
            else {
                console.log('Error en Farm:', err.text);
                let errmsg = { status: err.status, message: JSON.stringify(err) };
                reject(errmsg);
            }
        });
    }));
};
exports.getnoredirect = getnoredirect;
