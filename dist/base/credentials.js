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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pgsql_1 = __importDefault(require("../pgsql/pgsql"));
const debug_1 = __importDefault(require("./debug"));
const publicjwt_1 = __importDefault(require("./publicjwt"));
const config_1 = require("../config/config");
const server_1 = __importDefault(require("../server/server"));
const base64url_1 = __importDefault(require("base64url"));
let ValidateIPaddress = (IpAddr) => {
    return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(IpAddr));
};
class credentials {
    constructor() {
        this.launchers = [];
        this.apikeys = [];
    }
    check(_apikey) {
        let index = this.apikeys.indexOf(_apikey);
        if (index >= 0) {
            return this.launchers[index];
        }
        return undefined;
    }
    static checkOperatorAuth(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                console.log(`header:`, req.headers.authorization);
                if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
                    reject({ status: 401, message: 'Missing Authorization Header' });
                }
                else {
                    console.log(`Data Acquired`);
                    const base64Credentials = req.headers.authorization.split(' ')[1];
                    const credentials = JSON.parse(base64url_1.default.decode(base64Credentials.trim()));
                    //const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                    req.body._auth = credentials;
                    console.log(`Credentials`, credentials);
                    resolve({ status: 200 });
                }
            }));
        });
    }
    static checkToken(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!req.headers.authorization) {
                    reject({ status: 401, message: 'Missing Authorization Header' });
                }
                else {
                    resolve({ status: 200, message: "Authorized", identityid: 'neutral' });
                }
            }));
        });
    }
    static checkApikey(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!req.headers.apikey) {
                    reject({ status: 401, message: 'Missing Authentication Header' });
                }
                if (req.headers.apikey == undefined) {
                    reject({ status: 401, message: 'Missing Authentication Header' });
                }
                else {
                    let apikey = '';
                    if (typeof req.headers.apikey !== 'string') {
                        apikey = req.headers.apikey[0];
                    }
                    else {
                        apikey = req.headers.apikey;
                    }
                    console.log(server_1.default.params.platforms);
                    let platform = server_1.default.params.platforms.find((platform) => platform.apikey === apikey);
                    if (platform === undefined) {
                        reject({ status: 403, message: 'Not Athenicated' }); //reject(err)
                    }
                    else {
                        req.body._auth = { apikey: platform.apikey, lcoid: platform.lcoid, authmethod: platform.authmethod, ipvalidation: platform.ipvalidation, expires: platform.expires };
                        req.headers.authinfo = apikey;
                        resolve(platform);
                    }
                }
            }));
        });
    }
    static siteApikey(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!req.headers.apikey) {
                    reject({ status: 401, message: 'Missing Authentication Header' });
                }
                if (req.headers.apikey == undefined) {
                    reject({ status: 401, message: 'Missing Authentication Header' });
                }
                else {
                    let apikey = '';
                    if (typeof req.headers.apikey !== 'string') {
                        apikey = req.headers.apikey[0];
                    }
                    else {
                        apikey = req.headers.apikey;
                    }
                    console.log(server_1.default.params.platforms);
                    if (apikey === undefined) {
                        reject({ status: 403, message: 'Not Athenicated' }); //reject(err)
                    }
                    else {
                        req.body._auth = { apikey };
                        req.headers.authinfo = apikey;
                        resolve({ apikey });
                    }
                }
            }));
        });
    }
    static checkAuth(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
                    reject({ status: 401, message: 'Missing Authorization Header' });
                }
                if (req.headers.authorization == undefined) {
                    reject({ status: 401, message: 'Missing Authorization Header' });
                }
                else {
                    const base64Credentials = req.headers.authorization.split(' ')[1];
                    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                    const [identityid, secret] = credentials.split(':');
                    pgsql_1.default.CUD('identityauthorise', '$1::varchar,$2::varchar', [identityid, secret]).then((res) => {
                        debug_1.default.debug(`Auth Done`);
                        debug_1.default.debug(res);
                        req.body._auth = { identityid, secret };
                        resolve({ status: 200, message: "Authorised", identityid });
                    }).catch((err) => {
                        debug_1.default.error(err);
                        reject({ status: 403, message: 'Not Authorised' });
                    });
                }
            }));
        });
    }
    static checkUser(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (req.headers.Authorization !== undefined) {
                    let basic = req.headers.Authorization.indexOf('Basic ');
                    let bearer = req.headers.Authorization.indexOf('Bearer ');
                    if (basic !== undefined || bearer !== undefined) {
                        if (req.headers.Authorization.length === 0) {
                            reject({ status: 401, message: 'Missing Authorization Parameters' });
                            return;
                        }
                        console.log(`Authorization Header Found`);
                        const base64Credentials = req.headers.Authorization[bearer].split(' ')[1];
                        const creds = Buffer.from(base64Credentials, 'base64').toString('ascii');
                        const [identityid, secret] = creds.split(':');
                        pgsql_1.default.CUD('identityexists', '$1::varchar', [identityid]).then((res) => {
                            debug_1.default.debug(`Auth Pass`);
                            debug_1.default.debug(res);
                            req.body._auth = { identityid, secret };
                            resolve({ status: 200, message: "Identified", identityid });
                        }).catch((err) => {
                            debug_1.default.error(err);
                            reject({ status: 401, message: 'Not Found' });
                        });
                    }
                    else {
                        reject({ status: 401, message: 'Missing Authorization' });
                    }
                }
                else {
                    console.log(`No Authorization Header`, req.headers);
                    reject({ status: 401, message: 'Missing Authorization Header' });
                }
            }));
        });
    }
    static checkJWT(req) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                debug_1.default.debug(`headers`);
                debug_1.default.debug(JSON.stringify(req.headers));
                if (!req.headers.authorization) {
                    reject({ status: 401, message: 'Missings Authorization Header' });
                }
                else if (req.headers.authorization.indexOf('Bearer ') === -1) {
                    reject({ status: 401, message: 'Missing Authorization Header' });
                }
                else {
                    const originJWT = req.headers.authorization.split(' ')[1];
                    const credentials = publicjwt_1.default.verify(originJWT, config_1.JWTPublicKey);
                    debug_1.default.debug(`origin JWT`);
                    debug_1.default.debug(JSON.stringify(originJWT));
                    debug_1.default.debug(`credentials`);
                    debug_1.default.debug(JSON.stringify(credentials));
                    if (credentials.status !== 'success') {
                        reject({ status: 401, message: 'Missing Authorization' });
                    }
                    else {
                        req.body._auth = {
                            identityid: credentials.payload.yid,
                            email: credentials.payload.email,
                            role: credentials.payload.role,
                            walletid: credentials.payload.wll,
                            domain: credentials.payload.domain
                        };
                        //req.body._jwt = credentials.payload;
                        resolve({ status: 200, message: "Authorised", identityid: credentials.payload.yid });
                    }
                }
            }));
        });
    }
}
exports.default = credentials;
