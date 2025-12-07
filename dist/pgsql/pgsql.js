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
const config_1 = require("../config/config");
const debug_1 = __importDefault(require("../base/debug"));
const pg = require("pg");
const uuid_1 = require("uuid");
const server_1 = __importDefault(require("../server/server"));
class pgsql {
    static exec(func, data, params, operator) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response, reject) => __awaiter(this, void 0, void 0, function* () {
                _a.CUD(`${func}`, '$1::jsonb,$2::jsonb,$3::jsonb', [data, params, operator]).then((data) => {
                    //console.log(`Data from exec`)
                    //console.log(data);
                    response(data);
                }).catch((err) => {
                    reject(err);
                });
            }));
        });
    }
    static CUD(name, payload, values) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response, reject) => __awaiter(this, void 0, void 0, function* () {
                debug_1.default.deepsql(`SQL ${name}`);
                let query = `select ${name.trim().toLowerCase()}(${payload})`;
                //debug.deepsql('Info in query:')
                // debug.deepsql(JSON.stringify(values))
                yield _a.execCUD(query, values) //,values)
                    .then((result) => {
                    //debug.deepsql('Info in result:')
                    //debug.deepsql(JSON.stringify(result.rows));
                    let resp = result.rows[0][name];
                    //let resp = JSON.parse(result.rows[0][name]);
                    //debug.infosql(resp)
                    if (resp == null)
                        response([]);
                    response(resp);
                })
                    .catch((err) => __awaiter(this, void 0, void 0, function* () {
                    debug_1.default.infosql('Error from debugon');
                    debug_1.default.deepsql(JSON.stringify(err));
                    debug_1.default.infosql(`Code: ${err.code} => ${err.detail}`);
                    reject(yield debug_1.default.DBResponse(err.code, err.detail));
                }));
            }));
        });
    }
    static READ(name, payload, values) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response, reject) => __awaiter(this, void 0, void 0, function* () {
                debug_1.default.log(`SQL ${name}`);
                let query = `select ${name}(${payload})`;
                debug_1.default.infosql('Info in query:');
                debug_1.default.infosql(values);
                yield _a.execCUD_Read(query, values) //,values)
                    .then((result) => {
                    //debug.deepsql(result);
                    let resp = JSON.parse(result.rows[0][name]);
                    debug_1.default.infosql(resp);
                    if (resp == null)
                        response([]);
                    response(resp);
                })
                    .catch((err) => __awaiter(this, void 0, void 0, function* () {
                    debug_1.default.infosql('Error from debugon');
                    debug_1.default.deepsql(err);
                    debug_1.default.infosql(`Code: ${err.code} => ${err.detail}`);
                    reject(yield debug_1.default.DBResponse(err.code, err.detail));
                }));
            }));
        });
    }
    static execQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.instance.conectado) {
                    throw new Error('No conectado a la BD');
                }
                this.instance.pool.query(query.toString())
                    .then((res) => {
                    resolve(res);
                    return;
                })
                    .catch((err) => {
                    debug_1.default.deepsql("Error al ejecutar comando");
                    debug_1.default.deepsql(`Error in SQL command:\n
                Query: ${query}\n
                Response: ${err}`);
                    reject(err);
                    return;
                });
            });
        });
    }
    static execCUD(query, values) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!this.instance.conectado) {
                reject('Not Connected!');
            }
            let name = (0, uuid_1.v4)();
            const execQuery = {
                name: name,
                text: query.toString(),
                values: values
            };
            yield this.instance.pool.query(execQuery)
                .then((res) => {
                resolve(res);
                return;
            })
                .catch((err) => {
                debug_1.default.deepsql(`Error al ejecutar comando SQL en CUD ${query}`);
                debug_1.default.deepsql('Params');
                debug_1.default.deepsql(JSON.stringify(values));
                debug_1.default.deepsql(JSON.stringify(err));
                reject(err);
                return;
            });
        }));
    }
    static execQuery_Read(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.instance.conectado) {
                    throw new Error('No conectado a la BD');
                }
                this.instance.poolread.query(query.toString())
                    .then((res) => {
                    resolve(res);
                    return;
                })
                    .catch((err) => {
                    debug_1.default.deepsql("Error al ejecutar comando on READ");
                    debug_1.default.deepsql(`Error in SQL command:\n
                Query: ${query}\n
                Response: ${err}`);
                    reject(err);
                    return;
                });
            });
        });
    }
    static execCUD_Read(query, values) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!this.instance.conectado) {
                reject('Not Connected!');
            }
            let name = (0, uuid_1.v4)();
            const execQuery = {
                name: name,
                text: query.toString(),
                values: values
            };
            yield this.instance.poolread.query(execQuery)
                .then((res) => {
                resolve(res);
                return;
            })
                .catch((err) => {
                debug_1.default.deepsql(`Error al ejecutar comando SQL en CUD ${query}`);
                debug_1.default.deepsql('Params');
                debug_1.default.deepsql(JSON.stringify(values));
                debug_1.default.log(JSON.stringify(err));
                reject(err);
                return;
            });
        }));
    }
    constructor() {
        this.conectado = false;
        console.log(`Loading services [${config_1.pgUser}@${config_1.pgDatabase} ${config_1.pgServer} ${config_1.pgServerRead} ]`);
        this.pool = new pg.Pool({
            host: config_1.pgServer,
            user: config_1.pgUser,
            password: config_1.pgPass,
            database: config_1.pgDatabase
        });
        this.poolread = new pg.Pool({
            host: config_1.pgServerRead,
            user: config_1.pgUser,
            password: config_1.pgPass,
            database: config_1.pgDatabase
        });
        this.pool.on('error', (err) => {
            debug_1.default.error('-----------------------------');
            debug_1.default.error('Error on Pool Client detected');
            debug_1.default.error('-----------------------------');
            debug_1.default.error(err);
            debug_1.default.error('-----------------------------');
        });
        this.conectarDB();
    }
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    conectarDB() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Starting services [${config_1.pgUser}@${config_1.pgDatabase} ${config_1.pgServer} ${config_1.pgServerRead} ]`);
            try {
                this.pool.connect((err, client) => {
                    if (err) {
                        debug_1.default.error(err.message);
                    }
                    if (client === undefined) {
                        console.log(`Client Undefined`);
                        console.log(err);
                    }
                    client.query(`LISTEN ${config_1.pgListen}`, (err, result) => {
                        client.on('notification', (msg) => {
                            if (msg.channel === config_1.pgListen) {
                                console.log(`Notification from DB Server PG: ${JSON.stringify(msg)}`);
                                server_1.default.params.updateFromDatabase(msg.payload);
                            }
                            else {
                                console.log(`Notification on channel: ${JSON.stringify(msg)}`);
                            }
                        });
                        client.query(`NOTIFY ${config_1.pgListen},'START'`);
                    });
                    client.query('SELECT NOW() as date;', (err, result) => {
                        if (err) {
                            return console.log('Error executing query', err);
                        }
                        this.conectado = true;
                        debug_1.default.info(`Connected to DB server  ${config_1.pgServer}/${config_1.pgDatabase}:${config_1.pgUser} at ${result.rows[0].date}`);
                        server_1.default.startDB();
                    });
                });
            }
            catch (ex) {
                debug_1.default.error(`Exception:`);
                debug_1.default.error(ex);
            }
            //this.conectado = true;
            //debug.info(`Conectado a DB Server: ${pgServer}/${dbDatabase}:${dbUser}`);
        });
    }
    static toDateTimePg(fecha) {
        return __awaiter(this, void 0, void 0, function* () {
            let y = fecha.getFullYear().toString();
            let m = (fecha.getMonth() + 1).toString();
            let d = fecha.getDate().toString();
            let hh = fecha.getHours().toString();
            ;
            let mi = fecha.getMinutes().toString();
            ;
            let ss = fecha.getSeconds().toString();
            ;
            (d.length == 1) && (d = '0' + d);
            (m.length == 1) && (m = '0' + m);
            (hh.length == 1) && (hh = '0' + hh);
            (mi.length == 1) && (mi = '0' + mi);
            (ss.length == 1) && (ss = '0' + ss);
            let tiempo = `${y}-${m}-${d} ${hh}:${mi}:${ss}`;
            let res = `to_date('${tiempo}','YYYY-MM-DD HH24:MI:SS')`;
            return res;
        });
    }
    static convert(text) {
        return __awaiter(this, void 0, void 0, function* () {
            text = text.replace(/'/g, "");
            return text;
            /*let buff = Buffer.alloc(text.length,text.toString(),'latin1');
            //let buff = new Buffer(text.toString(), 'latin1');
            let utf8 = iconv.decode(buff,'utf8');
            let enc = iconv.encode(utf8,'latin1');
            return iconv.decode(enc, 'latin1');*/
        });
    }
}
_a = pgsql;
pgsql.sqlresponse = (req, res, sqlfn, data, params, operator) => __awaiter(void 0, void 0, void 0, function* () {
    //let [data, params, operator] = utils.getparams(req);
    // console.log(params);
    // operator = {operator: 'System', ip: req.ip, jwt: req.params._auth}
    // operator  = req.params._auth;
    // params['tenantid'] = operator.tenantid;
    _a.exec(sqlfn.toLocaleLowerCase(), data, params, operator).then((resp) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Response (sqlresponse) of ${sqlfn} ---> `);
        //console.log(resp);
        res.send(resp);
    })).catch((err) => {
        console.log(`Error`);
        res.status(404).send(err);
    });
});
pgsql.sqlexec = (req, res, sqlfn, data, params, operator) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        _a.exec(sqlfn.toLocaleLowerCase(), JSON.stringify(data), params, operator).then((resp) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`Response (exec) of ${sqlfn}`);
            resolve(resp);
        })).catch((err) => {
            console.log(`Error`);
            reject(err);
        });
    }));
});
pgsql.sqlrun = (sqlfn, data, params, operator) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        _a.exec(sqlfn.toLocaleLowerCase(), data, params, operator).then((resp) => __awaiter(void 0, void 0, void 0, function* () {
            //console.log(`Response (slqrun) of ${sqlfn}`)
            //console.log(resp);
            resolve(resp);
        })).catch((err) => {
            console.log(`Error`);
            debug_1.default.error(`Error in SQLRUN request`);
            debug_1.default.deepsql(err);
            reject(err);
        });
    }));
});
exports.default = pgsql;
