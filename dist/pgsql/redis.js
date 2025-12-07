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
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_1 = require("../config/config");
class Redis {
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_1.redisConn
        });
        this.conectado = false;
        if (config_1.redisConn !== "") {
            this.client = (0, redis_1.createClient)({
                url: config_1.redisConn
            });
            this.conectado = false;
            this.client.on('error', (err) => {
                console.log('Redis Client Error', err);
            });
            this.client.connect();
            console.log('Start Redis Local Connection');
        }
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log(`Redis save ${key} ${JSON.stringify(value)}`);
            this.client.set(key, JSON.stringify(value));
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                //console.log(`Redis recover ${key}`)
                yield this.client.get(key).then((value) => __awaiter(this, void 0, void 0, function* () {
                    if (value !== null)
                        resolve(JSON.parse(value));
                    else
                        reject({ error: true, message: `value returned by redis is null` });
                }));
            }));
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log(`Redis check ${key}`);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                //console.log(`Redis recover ${key}`)
                yield this.client.get(key).then(() => {
                    resolve(true);
                }).catch(() => {
                    resolve(false);
                });
            }));
        });
    }
    clearall() {
        return __awaiter(this, arguments, void 0, function* (channelid = 0) {
            //console.log(`Redis check ${key}`);
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                //console.log(`Redis recover ${key}`)
                if (channelid > 0) {
                    yield this.client.flushAll().then(() => {
                        resolve(true);
                    }).catch((err) => {
                        console.log(err);
                        resolve(false);
                    });
                }
                else {
                    resolve(true);
                }
            }));
        });
    }
}
exports.default = Redis;
