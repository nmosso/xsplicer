
import {Router,Request, Response} from 'express'; //Request, 
import debug from '../base/debug'
import superagent from 'superagent'

import credentials from './credentials'
import { debugMode } from '../config/config';
import server from '../server/server';
import pgsql from '../pgsql/pgsql';
const http = require('https');
import axios, { AxiosRequestHeaders } from 'axios';

export const crypto = require('crypto');

export const authTokens:any = {};

export interface urldata {
    url: string[],
    urldebug: string[],
    func: string,
    protocol:string
}

export  function cleartext(msg:string) {
    let data = msg.replace(/[^\w]/gi, '')
    return data; 
}
export  function validtext(msg:string) {
    return (msg.match(/[^\w]/gi));
    
}

export function isNumber(n:any) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); } 

export const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

export const decode64 = (str: string):string => Buffer.from(str, 'base64').toString('binary');
export const URI2Json = (search: any) => {
    let params = Object.fromEntries(  
        new URLSearchParams(search)
      )
    
    return JSON.parse(JSON.stringify(params));
}

export const rpl = (str:any) => {
    const re1 = /'|"|\`/gi;
    if (str !== undefined)  return str.toString().replace(re1,`´`);
    else return undefined;
    //return str;
    //return aux;
}
export const getHashedPassword = (password:string) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

export let ip = (req: Request) => {
    //console.log(req.headers);
    debug.log(`ips A: ${JSON.stringify(req.headers['cf-connecting-ip'])}}`)
    debug.log(`ips B: ${JSON.stringify(req.headers['x-forwarded-for'])}}`)
    let auxip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'];
    let ip:string = (auxip == undefined)?"empty": auxip.toString();
    return ip;
}

export let country = (req: Request) => { 
    let auxcn = req.headers['cf-ipcountry'];
    let cn:string = (auxcn == undefined )? "UN":auxcn.toString();
    return cn;
};

export let language = (req: Request) => {
    let lang = 'br';
    let auxlang = req.acceptsLanguages('pr', 'es', 'en');
    if (auxlang !== false) {
       lang=auxlang;
    }
    return lang;
}

export let actualtime = (func:string, ip: string, country:string) => {
    let date_ob = new Date();
    let pdate = `${date_ob.getFullYear()}-${date_ob.getMonth()}-${date_ob.getDay()} ${date_ob.getHours()}:${date_ob.getMinutes()}:${date_ob.getSeconds()}`;
    debug.log(`Entering in function ${func} at ${ pdate} | ip: ${ip} | Country: ${country}\n>>>>>>>>`,1,country);
}

export  function validmacadd(msg:string) {
    if (msg.trim().match(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/))
        return msg.toUpperCase().trim();
    else 
        return undefined;

}
export const requireAuth = (req: Request, res:Response, next:Function) => {
    console.log('Authorization con el Cookie!!')
    let cn = country(req);
    actualtime('EXCHANGE', ip(req), country(req));

    if (req.sessionID && req.session) {
        console.log(req.session.cookie);
        let Client:any = authTokens[req.sessionID];
        
        if (Client !== undefined) {
            next();
        } else {
            console.log('Nos vamos pal Login!')
            res.render('login', {
                message: 'Please login to continue',
                messageClass: 'alert-danger'
            });
        }
    }
};

export const validOrigin = (site:string) => {
    return (req: Request, res:Response, next:Function) => {
        // console.log('------------------------------------------------------------------')
        // console.log('Validaton origin')
        // console.log(req);
        // console.log('------------------------------------------------------------------')
        
        if (!checkurl(site,req.protocol,req.get('host'), country(req))) { 
            debug.error('///////////////////////////////////////////////////////////////////')
            debug.error(`Error: Invalid origin request: ${req.get('host')}  not authorised.`)
            res.status(401).send('Not Authorised');
            return;
        } else {
            console.log(`Origin Authorised`);
            next();
        }
    };
    
} 

export function addurl(url:string, func: string,typeurl:string = 'degug') {
    return new Promise(async (resolve, reject) => { 
        pgsql.CUD(`addcrossurls`,'$1::varchar,$2::varchar,$3::varchar',[url,func,typeurl]).then((data:any)=>{ 
            resolve({status:"ok"})
        }).catch((err:any) => {
            reject(err)
        });
    });
}


export function checkurl(func: string, protocol:string, url:string|undefined, country:string) {

    let procesed = false;
    let auxurl = '';
    if (url !== undefined) {
        auxurl = url;
    }
    server.params.urls.forEach(async (urlinfo:urldata) => {
        let funcs:any = urlinfo.func.split(',');
        if (funcs !== undefined) {
            await funcs.forEach(async (fn:any) => {
                if (urlinfo.func == fn) {
                    //procesed = true;
                    debug.log(`passing ${JSON.stringify(urlinfo)} in debug mode [${debugMode}] check [${auxurl}]`,8,country)
                    /*if (protocol !== '' && urlinfo.protocol != protocol ) {
                        debug.log(`Error in protocol: ${urlinfo.protocol} not equal to ${protocol}`,4,country)
                        
                    } else {*/
                    if (!debugMode) { 
                        if (urlinfo.url.indexOf(auxurl) < 0) {
                            //debug.debug(`${url} not enabled for ${func}`,4,country)
                            //debug.debug('error en la Matrix')
                        } else {
                            //console.log('URL filter passed');
                            debug.log('URL Filter passed');
                            procesed = true;
                        }; 
                    } else {
                        if (urlinfo.urldebug.indexOf(auxurl) < 0) {
                            //debug.debug('Error en la Matrix')
                            //debug.debug(`${url} not enabled for ${func}`,4,country)
                        } else {
                            //console.log('URL DEBUG filter passed');
                            debug.log('URL DEBUG Filter passed');
                            procesed = true;
                        }; 
                    }
                    //}
                }
            });
        }
    })  
    debug.log(`URL filter passed = ${procesed}`,8,country)
    return procesed;  
}


export const checkToken = () => {
    return (req: Request, res:Response, next:Function) => {
        debug.debug(`Checkig new Token`);
        
        credentials.checkToken(req).then(()=>{
            next();
        }).catch((err:any)=>{
            //console.log(`No api Key in header`);
            debug.error(err);
            res.status(err.status).send({status:"error",message:err.message});
            return;
        })

    };
}

export const checkJWT = () => {
    return (req: Request, res:Response, next:Function) => {
        debug.debug(`Checkig JWT Token`);
        
        credentials.checkJWT(req).then(()=>{
            next();
        }).catch((err:any)=>{
            //console.log(`No api Key in header`);
            debug.error(err);
            res.status(err.status).send({status:"error",message:err.message});
            return;
        })

    };
}

export const checkAuth = () => {
    return (req: Request, res:Response, next:Function) => {
        console.log(`Checkig new Auth basic or bearer`);
        console.log(req.headers)
        if (req.headers.authorization !== undefined && req.headers.authorization.indexOf('Basic ') > -1) {
            console.log(`Accessing with basic`)
            credentials.checkAuth(req).then(()=>{
                next();
            }).catch((err:any)=>{
                //console.log(`No api Key in header`);
                debug.error(err);
                res.status(err.status).send({status:"error",message:err.message});
                return;
            })
        } else if (req.headers.authorization !== undefined && req.headers.authorization.indexOf('Bearer ') > -1) {
            console.log(`Accessing with JWT auth Bearer`)
            credentials.checkJWT(req).then(()=>{
                next();
            }).catch((err:any)=>{
                //console.log(`No api Key in header`);
                debug.error(err);
                res.status(err.status).send({status:"error",message:err.message});
                return;
            })
        } else {
             res.status(401).send('Missing Authorization Header')
        }
    };
} 
 export const checkApikey = () => {

    return (req: Request, res:Response, next:Function) => {
        debug.debug(`Checkig new Auth`);
        
        credentials.checkApikey(req).then(()=>{
            next();
        }).catch((err:any)=>{
            //console.log(`No api Key in header`);
            debug.error(err);
            res.status(err.status).send({status:"error",message:err.message});
            return;
        })

    };
}
    export const siteOpertorAuth = () => {

    return (req: Request, res: Response, next: Function) => {
        debug.debug(`Checkig new Auth site Operator`);

        credentials.checkOperatorAuth(req).then(() => {
            console.log(`Auth Passed`)
            next();
        }).catch((err: any) => {
            console.log(`No autorizatipon granted`);
            console.log('Error:',err);
            res.status(err.status).send({ status: "error", message: err.message });
            return;
        })

    };
}
 export const siteApikey = () => {

    return (req: Request, res:Response, next:Function) => {
        debug.debug(`Checkig new Auth site API KEY`);
        
        credentials.siteApikey(req).then(()=>{
            next();
        }).catch((err:any)=>{
            //console.log(`No api Key in header`);
            debug.error(err);
            res.status(err.status).send({status:"error",message:err.message});
            return;
        })

    };
}

export const getDurationInMilliseconds = (start:any) => {
    const NS_PER_SEC = 1e9
    const NS_TO_MS = 1e6
    const diff = process.hrtime(start)

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}

export const checkUser = () => {
    return (req: Request, res:Response, next:Function) => {
        console.log(`Checkig new Auth`);
        
        credentials.checkUser(req).then(()=>{
            console.log(`User Auth Passed`)
            next();
        }).catch((err:any)=>{
            console.log(`Error un checkUser`);
            console.log(err);
            res.status(err.status).send({status:"error",message:err.message});
            return;
        })

    };
} 


export const post = (url:string, headers:any, params:any ) => {
    return new Promise(async (resolve, reject) => { 
        superagent
        .post(url)
        .send(JSON.stringify(params))
        .set(headers)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .then( (res:any) => {
            //console.log('Response')
            //console.log(res.body);
            resolve(res.body);
        })
        .catch( (err:any) => {
            console.log('Error en POST:');
            let errmsg = {status:err.errno, err}
            reject(errmsg);
        });
    });
}

export const get = (url:string, headers:any ) => {
    return new Promise(async (resolve, reject) => { 
        superagent
        .get(url)
        .timeout({
            response: 5000,  // Wait 5 seconds for the server to start sending,
            deadline: 60000, // but allow 1 minute for the file to finish loading.
        })
        .buffer(false)
        .set(headers)
        .set('Accept', 'application/json')
        .then( (res:any) => {
            //console.log(`GET Response from ${url} `)
            //console.log(res.body);
            resolve(res.body);
        })
        .catch( (err:any) => {
            console.log(`Error en GET: ${url}`);
            console.error('Detalles del error:', err);
            let errmsg = {status:err.status, message:JSON.stringify(err)}
            reject(errmsg);
        });
    });
}


export const putAxios = (url: string, extraHeaders: any, params: any) => {
    return new Promise<any>(async (resolve, reject) => {
        // 1) Serializar el body explícitamente para controlar exactamente lo que se envía
        const bodyStr = JSON.stringify(params);

        // 2) Construir headers y forzar Content-Length (evita chunked transfer)
        const headers = {
            //'Content-Type': 'application/json',
            //'Content-Length': Buffer.byteLength(bodyStr).toString(),
            'User-Agent': 'Mozilla/5.0 (compatible; DebugAxios/1.0)',
            ...extraHeaders
        };

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
        const reqInterceptor = axios.interceptors.request.use(cfg => {
            console.log('--- AXIOS REQUEST CONFIG ---');
            console.log('url:', cfg.url);
            console.log('method:', cfg.method);
            console.log('headers:', cfg.headers);
            console.log('body (first 1000 chars):', (cfg.data || '').toString().slice(0, 1000));
            return cfg;
        });

        try {
            const res = await axios(axiosConfig);

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
            } catch (e) {
                console.log('no pude leer raw request details:', e);
            }

            axios.interceptors.request.eject(reqInterceptor);
            return res.data;
        } catch (err:any) {
            axios.interceptors.request.eject(reqInterceptor);

            console.log('--- AXIOS ERROR ---');
            if (err.response) {
                // servidor respondió con status >= 400
                console.log('status:', err.response.status);
                console.log('response headers:', err.response.headers);
                console.log('response body:', err.response.data);
            } else if (err.request) {
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
                } catch (e) {
                    console.log('no pude leer err.request internals:', e);
                }
                console.log('err.code:', err.code);
            } else {
                // algo falló construyendo la petición
                console.log('error message:', err.message);
            }
            throw err;
        }
    });
};


import https from 'https';
import { URL } from 'url';

export const putHttp = (url: string, headers: any, params: any) => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const data = JSON.stringify(params);

            const options: any = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'PUT',
                headers: {
                    'Content-Length': Buffer.byteLength(data),
                    ...headers,
                },
            };

            const req = client.request(options, (res:any) => {
                let body = '';

                res.on('data', (chunk:any) => {
                    body += chunk;
                });

                res.on('end', () => {
                    try {
                        const json = JSON.parse(body || '{}');
                        resolve(json);
                    } catch (err) {
                        resolve(body); // por si no es JSON válido
                    }
                });
            });

            req.on('error', (err:any) => {
                console.error('Error en PUT:', err);
                reject({ status: err.errno || -1, err });
            });

            req.write(data);
            req.end();
        } catch (err: any) {
            reject({ status: err.errno || -1, err });
        }
    });
};

export const put = (url: string, headers: any, params: any) => {
    return new Promise(async (resolve, reject) => {
        const bodyStr = JSON.stringify(params);

        const req = superagent
            .put(url)
            .set(headers)
            .set('Content-Length', Buffer.byteLength(bodyStr).toString())
            //.set('Accept', 'application/json, text/plain, */*')
            //.set('Content-Type', 'application/json')
            .send(params)
            .then((res: any) => {
                //console.log('Response')
                //console.log(res.body);
                resolve(res.body);
            })
            .catch((err: any) => {
                console.log('Error en PUT:');
                let errmsg = { status: err.errno, err }
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

    });
}



import * as fs from 'fs';
import * as path from 'path';

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
export const downloadImage = async (url: string, savePath: string, fileName: string) => {
    try {
        const res = await superagent.get(url).responseType('blob');
        const fullPath = path.join(savePath, fileName);
        fs.writeFileSync(fullPath, res.body);
        //console.log(`Imagen guardada en: ${fullPath}`);
    } catch (error) {
        console.error(`Error al descargar la imagen: ${error} => ${url} => ${fileName}`);
    }
}
export const downloadFileOld= async (url: string, savePath: string, fileName: string) => {
    return new Promise(async (resolve, reject) => { 
        try {

            const res = await superagent.get(url).responseType('blob');
            const fullPath = path.join(savePath, fileName);
            fs.writeFileSync(fullPath, res.body);
            resolve({ fullPath });
        } catch (error) {
            console.error(`Error al descargar la imagen: ${error}`);
            reject(error)
        }
    });

}

//function downloadFile(url, outputPath) {
export const downloadFile = async (url: string, outputPath: string) => {    
    return new Promise(async (resolve, reject) => { 
        try {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                console.log(`Creatin dir ${dir}`)
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Directorio creado: ${dir}`);
            }

            const file = fs.createWriteStream(outputPath);
            console.log(`Start download:${url} => ${outputPath}`)
            http.get(url, (response: any) => {
                if (response.statusCode !== 200) {
                    console.error(`Error al descargar archivo. Código de estado: ${response.statusCode}`);
                    response.resume(); // Consume el response para liberar el recurso.
                    reject({status:'Not found'})
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => console.log("Descarga completada."));
                    resolve({ outputPath });
                });
            }).on('error', (err: any) => {
                fs.unlink(outputPath, () => console.error("Error al descargar archivo:", err)); // Elimina el archivo si hay un error.
                reject(err)
            });
        } catch(err) {
            console.log(`Error after Try`)
            reject(err)
        }
    });

}

export const  getFileExtensionFromUrl = (url: string) => {
    // Extraer el nombre del archivo de la URL
    const fileName = url.split('/').pop();

    // Verificar si el nombre del archivo contiene un punto
    if (fileName && fileName.includes('.')) {
        // Retornar la parte de la extensión del nombre del archivo
        return fileName.split('.').pop() || '';
    }

    return '';
}

export const head = (url: string, headers: any) => {
    return new Promise(async (resolve, reject) => {
        superagent
            .head(url)
            .set(headers)
            .set('Accept', 'application/json')
            .then((res: any) => {
                //console.log(`GET Response from ${url} `)
                //console.log(res.body);
                resolve(res);
            })
            .catch((err: any) => {
                console.log(`Error en HEAD [${err.status}]: ${url}`);

                let errmsg = { status: err.status, message: JSON.stringify(err) }
                reject({ error: true, errcode: err.status });
            });
    });
}

export const getnoredirect = (url: string, host: string, ip: string) => {
    return new Promise(async (resolve, reject) => {
        superagent
            .get(url)
            .set('Host', host)
            .set('X-Forwarded-For', ip)
            .redirects(0)
            .then((res: any) => {
                reject('Response non a redirect');
            })
            .catch((err: any) => {
                //console.log('Error en get no redirect:', err);
                console.log('-----------------------------------------------------------')
                console.log(err.status)
                if (err.status == '302') {
                    console.log(err.response.res.rawHeaders[1])
                    let rsp = { http_session_url: err.response.res.rawHeaders[1], address: host };
                    resolve(rsp);
                } else {
                    console.log('Error en Farm:', err.text);
                    let errmsg = { status: err.status, message: JSON.stringify(err) }
                    reject(errmsg);
                }
            });
    });
}


