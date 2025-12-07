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
const crypto = require('crypto');
class Assets {
    static responselog(info) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response, reject) => __awaiter(this, void 0, void 0, function* () {
                console.log(`=====================================================`);
                console.log(`==> RESPONSE LOG `);
                console.log(`=====================================================`);
                console.log(info);
                console.log(`=====================================================`);
                pgsql_1.default.CUD(`dblog`, '$1::jsonb', [info]).then((data) => {
                    response({ status: "success" });
                }).catch((err) => {
                    console.log(`=====================================================`);
                    console.log(`==> Fatal error in DB log `);
                    console.log(`=====================================================`);
                    console.log(err);
                    console.log(`=====================================================`);
                    response({ status: "fail" });
                });
            }));
        });
    }
    static responseloginfo(data, info) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response, reject) => __awaiter(this, void 0, void 0, function* () {
                //console.log(`Exec responselog`)
                //console.log(info);
                pgsql_1.default.CUD(`dblog`, '$1::jsonb,$2::jsonb', [data, info]).then((data) => {
                    response({ status: "success" });
                }).catch((err) => {
                    console.log(`=====================================================`);
                    console.log(`==> Fatal error in DB log `);
                    console.log(`=====================================================`);
                    console.log(err);
                    console.log(`=====================================================`);
                    response({ status: "fail" });
                });
            }));
        });
    }
}
_a = Assets;
Assets.APaths = [];
Assets.updatePaths = () => {
    return new Promise((response, reject) => __awaiter(void 0, void 0, void 0, function* () {
        pgsql_1.default.CUD(`getAccountPaths`, '', []).then((data) => {
            _a.APaths.splice(_a.APaths.length);
            _a.APaths.push(data);
            response({ status: "ok" });
        }).catch((err) => {
            reject(err);
        });
    }));
};
Assets.gentoken = (password, asset, ip, time, cdnkey = '') => {
    return new Promise((response, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let concat = `${password.trim()}${asset.trim()}${ip.trim()}${time.trim}${cdnkey}`;
            let hash = crypto.createHash('md5').update(concat).digest("hex");
            response(hash);
        }
        catch (err) {
            reject(err);
        }
    }));
};
Assets.checktoken = (token, password, asset, ip, time, cdnkey = '') => {
    return new Promise((response, reject) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            _a.gentoken(password, asset, ip, time, cdnkey).then((hash) => {
                if (hash.trim() == token.trim()) {
                    response({ status: "ok" });
                }
                else {
                    reject({ status: "error" });
                }
            });
        }
        catch (err) {
            reject(err);
        }
    }));
};
exports.default = Assets;
