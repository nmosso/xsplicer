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
//import {logger} from '../config/debug';
const config_1 = require("../config/config");
const mariadb = require('mariadb');
class MariaDB {
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    static execQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                MariaDB.conn.query(query).then((rows) => {
                    let response = { status: 'success', result: rows, error: undefined };
                    resolve(response);
                }).catch((err) => {
                    let response = { status: 'error', result: undefined, error: err };
                    reject(response);
                });
            });
        });
    }
    static execCommand(query, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                MariaDB.conn.query(query, data).then((rows) => {
                    let response = { status: 'success', result: rows, error: undefined };
                    resolve(response);
                }).catch((err) => {
                    let response = { status: 'error', result: undefined, error: err };
                    reject(response);
                });
            });
        });
    }
    constructor() {
        this.params = {
            host: config_1.dbServer,
            port: config_1.dbPort,
            user: config_1.dbUser,
            password: config_1.dbPass,
            database: config_1.dbDatabase,
            connectionLimit: 5
        };
        this.conectado = false;
        console.log(`Loading services [${config_1.dbUser}@${config_1.dbDatabase} ${config_1.dbServer} ]`);
        console.log(`Connectir MariaDB`);
        console.log(this.params);
        //MariaDB.pool = mariadb.createPool(params);
        try {
            this.conectarDB().then((resp) => console.log(resp));
        }
        catch (err) {
            console.log(`Error creating connection to MariaBD`);
            console.log(err);
        }
    }
    conectarDB() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    MariaDB.conn = yield mariadb.createConnection(this.params);
                    const rows = yield MariaDB.conn.query("SELECT 1 as val");
                    console.log(rows);
                    resolve({ status: 'connected' });
                }
                catch (err) {
                    console.log('not connected due to error: ' + err);
                }
            }));
        });
    }
    conectarDB2() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                MariaDB.conn = yield MariaDB.pool.getConnection();
                try {
                    MariaDB.conn = yield MariaDB.pool.getConnection();
                    console.log('connected ! connection id is ' + MariaDB.conn.threadId);
                    MariaDB.conn.release(); //release to pool
                    const rows = yield MariaDB.conn.query("SELECT 1 as val");
                    console.log(rows);
                    resolve({ status: 'connected' });
                }
                catch (err) {
                    console.log('not connected due to error: ' + err);
                }
            }));
        });
    }
}
exports.default = MariaDB;
