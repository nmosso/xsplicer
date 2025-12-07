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
const jwt_1 = __importDefault(require("./jwt"));
const authTokens = {};
class Identities {
}
_a = Identities;
Identities.login = (username, password, apikey, domain, method = 'email', operator = {}) => {
    return new Promise((response, reject) => __awaiter(void 0, void 0, void 0, function* () {
        let func = 'login';
        pgsql_1.default.CUD(`${func}`, '$1::jsonb,$2::text,$3::jsonb', [{ username, password }, { method, apikey, domain }, operator]).then((data) => {
            //Response JWT Info
            let resp = jwt_1.default.sign(data, 60 * 60 * 1);
            response(resp);
        }).catch((err) => {
            reject(err);
        });
    }));
};
exports.default = Identities;
