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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const pgsql_1 = __importDefault(require("../pgsql/pgsql"));
const debug_1 = __importDefault(require("./debug"));
const utils_1 = __importDefault(require("./utils"));
const jwt_1 = __importDefault(require("./jwt"));
class AuthApi {
}
_a = AuthApi;
AuthApi.login = (req, res) => {
    debug_1.default.info(`Auth Device with User / password`);
    let [data, params, operator] = utils_1.default.getparams(req);
    let domain = utils_1.default.getCorsDomain(req);
    operator = { operator: 'System', ip: req.ip, apikey: req.params._apikey, domain };
    data['apikey'] = req.params._apikey;
    debug_1.default.info(`Params from retest : ${JSON.stringify(data)}}`);
    let iat = Math.floor(Date.now() / 1000);
    let exp = iat + 60 * 60 * 4;
    data['iat'] = iat;
    data['epx'] = exp;
    pgsql_1.default.exec('identitieslogin', data, params, operator).then((info) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(info);
        let token = yield jwt_1.default.sign(info, exp);
        res.send({ token, name: info.name, role: info.role });
    })).catch((err) => {
        res.status(404).send(err);
    });
};
AuthApi.register = (req, res) => {
    debug_1.default.info(`Auth Register with User / password`);
    let [data, params, operator] = utils_1.default.getparams(req);
    operator = { operator: 'System', ip: req.ip, apikey: req.params._apikey };
    data['apikey'] = req.params._apikey;
    debug_1.default.info(`Params from retest : ${JSON.stringify(data)}}`);
    let expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    let token = jwt_1.default.sign(data, 60 * 60 * 24);
    data['jwt'] = token;
    pgsql_1.default.exec('identitiesgerister', data, params, operator).then((info) => {
        //console.log(info);
        res.send({ token, expiration });
    }).catch((err) => {
        res.status(404).send(err);
    });
};
exports.default = AuthApi;
