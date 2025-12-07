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
const crypto = require('crypto');
const PASSWORD_LENGTH = 18;
const LOWERCASE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'; // 26 chars
const UPPERCASE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // 26 chars
const NUMBERS = '0123456789'; // 10 chars
const SYMBOLS = ',./<>?;\'":[]\\|}{=-_+`~!@#$%^&*()'; // 32 chars
const ALPHANUMERIC_CHARS = LOWERCASE_ALPHABET + UPPERCASE_ALPHABET + NUMBERS; // 62 chars
const ALL_CHARS = ALPHANUMERIC_CHARS + SYMBOLS; // 94 chars
class util {
    static getCorsDomain(req) {
        let domain = _a.removeHttp(req.get('host'));
        return domain;
    }
    static removeHttp(url) {
        if (url == undefined)
            return '';
        let aux = url.replace(/^https?:\/\//, '').replace(/^http?:\/\//, '').replace(/\/.*/g, '');
        return aux;
    }
    static generateRandomPassword(length) {
        let rb = crypto.randomBytes(length);
        let rp = "";
        for (let i = 0; i < length; i++) {
            rb[i] = rb[i] % ALL_CHARS.length;
            rp += ALL_CHARS[rb[i]];
        }
        return rp;
    }
    static isEmail(email) {
        try {
            const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegexp.test(email);
        }
        catch (err) {
            return false;
        }
    }
    static toJsonbArray(codes) {
        if (codes === undefined)
            return '[]';
        let list = codes.toString().split(',');
        let result = '';
        for (let i = 0; i < list.length; i++) {
            result += `"${list[i].trim()}",`;
        }
        result = '[' + result.substring(0, result.length - 1) + ']';
        return result;
    }
    static recoverParam(req, param, defaultvalue = null) {
        if (req === null)
            return defaultvalue;
        if (req.body == null && req.query == null)
            return defaultvalue;
        if (req.body.hasOwnProperty(param)) {
            return req.body[param];
        }
        else if (req.query.hasOwnProperty(param)) {
            return req.query[param];
        }
        else
            return defaultvalue;
    }
    static recoverParamList(req, param) {
        let defaultvalue = '[]';
        let aux = '';
        if (req === null)
            return defaultvalue;
        if (req.body == null && req.query == null)
            return defaultvalue;
        if (req.body.hasOwnProperty(param)) {
            aux = req.body[param];
        }
        else if (req.query.hasOwnProperty(param)) {
            aux = String(req.query[param]);
        }
        else
            return defaultvalue;
        if (aux !== undefined && aux.length > 0)
            return _a.toJsonbArray(aux);
        return defaultvalue;
    }
    static isJsonString(str) {
        try {
            JSON.parse(str);
        }
        catch (e) {
            return false;
        }
        return true;
    }
    static removeFromArray(json, key) {
        delete json[key];
    }
    static getparams(req, id) {
        //console.log(req)
        let operator = req.body._auth;
        let params = req.body._auth;
        let data = req.body;
        if (req.method == 'GET') {
            data = req.query;
        }
        else {
            console.log(req.body);
            delete data['_auth'];
        }
        if (data == null) {
            data = {};
        }
        console.log(`method ${req.method} typeof: ${typeof id} id: ${id}`);
        if (typeof id !== 'undefined') {
            if (req.params[id])
                params[id] = req.params[id];
        }
        /*
        if (req.headers.authorization !== undefined && req.headers.authorization.indexOf('Bearer ') > -1) {
            //Aqui llego un JWT con la info del operador
            console.log(`Accessing with JWT auth Bearer`);
            let jwt =  req.body._jwt;
            console.log(jwt);
            operator['identityid'] = ''; //jwt.identityid;
            operator['username'] = jwt.username;
            operator['role'] = jwt.role;
            delete data['_jwt']
        }*/
        //operator = this.removeFromArray(operator,'secret');
        console.log('----------------------');
        console.log(data);
        console.log(params);
        console.log(operator);
        return [data, params, operator];
        // /return [JSON.stringify( data),JSON.stringify( params),JSON.stringify( operator)];
    }
    static getmutiparams(req, ids) {
        //console.log(req)
        let operator = req.body._auth;
        let params = {};
        let data = req.body;
        if (req.method == 'GET') {
            data = req.query;
        }
        else {
            //console.log(req.body)
            delete data['_auth'];
        }
        if (data == null) {
            data = {};
        }
        //console.log(`method ${req.method} typeof: ${typeof ids} id: ${ids}`);
        if (typeof ids !== 'undefined') {
            //console.log(`Adding params to query`)
            //console.log(req.params);
            ids.forEach(id => {
                if (req.params[id])
                    params[id] = req.params[id];
            });
        }
        return [data, params, operator];
        // /return [JSON.stringify( data),JSON.stringify( params),JSON.stringify( operator)];
    }
}
_a = util;
util.slugify = (text) => {
    return text
        .normalize("NFD") // Normaliza para separar caracteres diacríticos
        .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (acentos, tildes, etc.)
        .replace(/[^a-zA-Z0-9\s]/g, "") // Elimina caracteres especiales
        .trim() // Elimina espacios al inicio y al final
        .toLowerCase() // Convierte a minúsculas
        .replace(/\s+/g, "_"); // Reemplaza espacios por guiones bajos
};
util.removeQuotes = (obj) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof obj === 'string') {
            // Elimina comillas dobles y simples de la cadena
            //let aux:string = obj;
            //console.log("from[", aux, "] to [", obj.replace(/["']/g, '`'),"]")
            resolve(obj.replace(/["']/g, '`').replace(/[\t\r\n]/g, ''));
        }
        else if (Array.isArray(obj)) {
            // Si es un arreglo, aplica la función a cada elemento
            //resolve(obj.map(await this.removeQuotes));
            const newArray = [];
            for (const element of obj) {
                //console.log('Array element: ', element)
                newArray.push(yield _a.removeQuotes(element));
            }
            resolve(newArray);
        }
        else if (obj !== null && typeof obj === 'object') {
            //Si es un objeto, aplica la función a cada valor
            // return Object.keys(obj).reduce(async (acc:any, key:any) => {
            //     acc[key] = await this.removeQuotes(obj[key]);
            //     return acc;
            // }, {});
            const newObj = {};
            for (const key of Object.keys(obj)) {
                //console.log("key:", key)
                newObj[key] = yield _a.removeQuotes(obj[key]);
            }
            resolve(newObj);
        }
        else {
            resolve(obj);
        }
        // Si no es una cadena, arreglo u objeto, retorna el valor tal cual
    }));
});
exports.default = util;
