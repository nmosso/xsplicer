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
exports.RedisBase = void 0;
const express = require("express");
const parameters_1 = __importDefault(require("../pgsql/parameters"));
const redis_1 = __importDefault(require("../pgsql/redis"));
let cors = require('cors');
const bodyParser = require('body-parser');
exports.RedisBase = new redis_1.default();
class Server {
    constructor(port) {
        this.port = port;
        //Server.fastPort = fastPort;
        this.app = express();
        this.app.use(bodyParser.json({ limit: '50mb' })); // support json encoded bodies
        this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // support encoded bodies
        let corsOptions = { origin: '*', //credentials: true , 
            methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
            allowedHeaders: ['Content-Type', 'Authorization', 'fingerprint', 'apikey'] // Headers permitidos};
        };
        this.app.use(cors(corsOptions));
    }
    static init(port) {
        return new Server(port);
    }
    start(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Starting Server at ${this.port} `);
            this.app.listen(this.port);
        });
    }
    static startDB() {
        return __awaiter(this, void 0, void 0, function* () {
            Server.params = new parameters_1.default();
        });
    }
    static sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
exports.default = Server;
