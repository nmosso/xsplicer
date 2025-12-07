
//import {logger} from '../config/debug';
import { Router, Request, Response } from 'express'; //Request, 
import { pgServer, pgServerRead, pgUser,pgPass,pgDatabase,debugDB,pgListen} from '../config/config';
import debug from '../base/debug'
import utils from '../base/utils'
import pg = require('pg');
import pgpool = require('pg-pool');
import { v4 as uuidv4 } from 'uuid';
import { BlobOptions } from 'buffer';
import { Server } from 'http';
import server from '../server/server';

export default class pgsql {
    private static _instance: pgsql;

    //pool: pg.Pool;
    pool: pg.Pool;
    poolread: pg.Pool;
    //client: pg.Client; 
    conectado: boolean;
    
 public static sqlresponse = async (req: Request, res: Response,sqlfn:string,data:any, params:any, operator:any)  => {
        //let [data, params, operator] = utils.getparams(req);
        // console.log(params);
        // operator = {operator: 'System', ip: req.ip, jwt: req.params._auth}
        // operator  = req.params._auth;
        // params['tenantid'] = operator.tenantid;

        pgsql.exec(sqlfn.toLocaleLowerCase(),data, params, operator).then(async (resp:any) => {
            console.log(`Response (sqlresponse) of ${sqlfn} ---> `)
            //console.log(resp);
            res.send(resp);
        }).catch((err: any) => {
            console.log(`Error`)
            res.status(404).send(err)
        });
    }
    public static sqlexec = async (req: Request, res: Response,sqlfn:string,data:any, params:any, operator:any)  => {
        return new Promise(async (resolve, reject) => { 

            pgsql.exec(sqlfn.toLocaleLowerCase(),JSON.stringify(data), params, operator).then(async (resp:any) => {
                console.log(`Response (exec) of ${sqlfn}`)
                resolve(resp);
            }).catch((err: any) => {
                console.log(`Error`)
                reject(err)
            });
        });

    }    
    public static sqlrun = async (sqlfn:string,data:any, params:any, operator:any)  => {
        return new Promise(async (resolve, reject) => { 
            pgsql.exec(sqlfn.toLocaleLowerCase(),data, params, operator).then(async (resp:any) => {
                //console.log(`Response (slqrun) of ${sqlfn}`)
                //console.log(resp);
                resolve(resp);
            }).catch((err: any) => {
                console.log(`Error`)
                debug.error(`Error in SQLRUN request`)
                debug.deepsql(err);
                reject(err)
            });
        });

    } 
    
    public static async  exec (func: string, data:any, params:any, operator:any ) {
        return new Promise(async (response, reject) => { 
            pgsql.CUD(`${func}`,'$1::jsonb,$2::jsonb,$3::jsonb',[data,params,operator]).then((data)=>{
                //console.log(`Data from exec`)
                //console.log(data);
                response(data);
            }).catch((err:any) => {
                reject(err)
            })
        });
    }


    public static async CUD(name:string, payload:string, values:any) { //qrtoken
        return new Promise(async (response, reject) => { 
            debug.deepsql(`SQL ${name}`);
            let query = `select ${name.trim().toLowerCase()}(${payload})`;

            //debug.deepsql('Info in query:')
           // debug.deepsql(JSON.stringify(values))
            await pgsql.execCUD(query,values) //,values)
            .then((result:any) => {
                //debug.deepsql('Info in result:')
                //debug.deepsql(JSON.stringify(result.rows));

                let resp =  result.rows[0][name];
                //let resp = JSON.parse(result.rows[0][name]);
                //debug.infosql(resp)
                if (resp == null) response([]);
                response(resp);
            })
            .catch(async (err:any) => {
                debug.infosql('Error from debugon');
                debug.deepsql(JSON.stringify(err));
                debug.infosql(`Code: ${err.code} => ${err.detail}`)
                reject(await debug.DBResponse(err.code, err.detail))
            });  
              
        }); 
    }

    public static async READ(name:string, payload:string, values:any) { //qrtoken
        return new Promise(async (response, reject) => { 
            debug.log(`SQL ${name}`);
            let query = `select ${name}(${payload})`;

            debug.infosql('Info in query:')
            debug.infosql(values)
            await pgsql.execCUD_Read(query,values) //,values)
            .then((result:any) => {

                //debug.deepsql(result);
                let resp = JSON.parse(result.rows[0][name]);
                debug.infosql(resp)
                if (resp == null) response([]);
                response(resp);
            })
            .catch(async (err:any) => {
                debug.infosql('Error from debugon');
                debug.deepsql(err);
                debug.infosql(`Code: ${err.code} => ${err.detail}`)
                reject(await debug.DBResponse(err.code, err.detail))
            });  
        }); 
    }

    static async execQuery(query: String) {
        return new Promise((resolve, reject) => {
            if (!this.instance.conectado) {
                throw new Error('No conectado a la BD');
            }
            
            this.instance.pool.query(query.toString())
            .then((res:any) => {

                resolve(res);
                return;
            })
            .catch ((err:any) => {                   
                debug.deepsql("Error al ejecutar comando");
                debug.deepsql(`Error in SQL command:\n
                Query: ${query}\n
                Response: ${err}`);
                reject(err);
                return;
            });        
        });
    }
    static execCUD(query: String, values: Object[]) {
        return new Promise(async (resolve, reject) => {
            if (!this.instance.conectado) {
                reject('Not Connected!');
            }
            let name = uuidv4();
            const execQuery = {
                name: name,
                text: query.toString(),
                values: values
            }
            await this.instance.pool.query(execQuery)
             .then((res:any) => {
                resolve(res);
                return;
            })
            .catch ((err:any) => {                   
                debug.deepsql(`Error al ejecutar comando SQL en CUD ${query}`);
                debug.deepsql('Params');
                debug.deepsql(JSON.stringify(values));
                debug.deepsql(JSON.stringify(err));
                reject(err);
                return;
            });       
        });        
    }
    static async execQuery_Read(query: String) {
        return new Promise((resolve, reject) => {
            if (!this.instance.conectado) {
                throw new Error('No conectado a la BD');
            }
            
            this.instance.poolread.query(query.toString())
            .then((res:any) => {
                resolve(res);
                return;
            })
            .catch ((err:any) => {                   
                debug.deepsql("Error al ejecutar comando on READ");
                debug.deepsql(`Error in SQL command:\n
                Query: ${query}\n
                Response: ${err}`);
                reject(err);
                return;
            });        
        });
    }
    static execCUD_Read(query: String, values: Object[]) {
        return new Promise(async (resolve, reject) => {
            if (!this.instance.conectado) {
                reject('Not Connected!');
            }
            let name = uuidv4();
            const execQuery = {
                name: name,
                text: query.toString(),
                values: values
            }
            
            await this.instance.poolread.query(execQuery)
             .then((res:any) => {
                resolve(res);
                return;
            })
            .catch ((err:any) => {                   
                debug.deepsql(`Error al ejecutar comando SQL en CUD ${query}`);
                debug.deepsql('Params');
                debug.deepsql(JSON.stringify(values));
                debug.log(JSON.stringify(err));
                reject(err);
                return;
            });       
        });        
    }
    constructor() {
        this.conectado = false;
        console.log(`Loading services [${pgUser}@${pgDatabase} ${pgServer} ${pgServerRead} ]`)
        this.pool = new pg.Pool ({
            host: pgServer,            
            user: pgUser,
            password: pgPass,
            database: pgDatabase
        });
        this.poolread = new pg.Pool ({
            host: pgServerRead,            
            user: pgUser,
            password: pgPass,
            database: pgDatabase
        });
        this.pool.on('error', (err:any) => {
            debug.error('-----------------------------');
            debug.error('Error on Pool Client detected');
            debug.error('-----------------------------');
            debug.error(err);
            debug.error('-----------------------------');
        });

        this.conectarDB();
    }

    public static get instance() {
        return this._instance || (this._instance= new this());
    }
    private async conectarDB() {
        console.log(`Starting services [${pgUser}@${pgDatabase} ${pgServer} ${pgServerRead} ]`)
        try {
            this.pool.connect((err: any, client:any) => {
                if (err) {
                    debug.error(err.message);
                } 
                if (client === undefined) {
                    console.log(`Client Undefined`);
                    console.log(err);
                }
                client.query(`LISTEN ${pgListen}`, (err:any, result:any) => {
                    client.on('notification', (msg:any) => {
                        if (msg.channel === pgListen) {
                            console.log(`Notification from DB Server PG: ${JSON.stringify(msg)}`)
                            server.params.updateFromDatabase(msg.payload);
                        } else {
                            console.log(`Notification on channel: ${JSON.stringify(msg) }`)
                        }
                    })

                    client.query(`NOTIFY ${pgListen},'START'`);
                });
                                
                client.query('SELECT NOW() as date;', (err:any, result:any) => {
                    if (err) {
                        return console.log('Error executing query', err);
                    }
                    this.conectado = true;
                    debug.info(`Connected to DB server  ${pgServer}/${pgDatabase}:${pgUser} at ${result.rows[0].date}`)
                    server.startDB();
                })
            });
        } catch (ex:any) {
            debug.error(`Exception:`);
            debug.error(ex);
        }
        //this.conectado = true;
        //debug.info(`Conectado a DB Server: ${pgServer}/${dbDatabase}:${dbUser}`);
    }

    public static async toDateTimePg(fecha:Date) {		
		let y = fecha.getFullYear().toString();
		let m = (fecha.getMonth() + 1).toString();
		let d = fecha.getDate().toString();
		let hh = fecha.getHours().toString();;
		let mi = fecha.getMinutes().toString();;
		let ss = fecha.getSeconds().toString();;
		(d.length == 1) && (d = '0' + d);
		(m.length == 1) && (m = '0' + m);
		(hh.length == 1) && (hh = '0' + hh);
		(mi.length == 1) && (mi = '0' + mi);
		(ss.length == 1) && (ss = '0' + ss);
		let tiempo = `${y}-${m}-${d} ${hh}:${mi}:${ss}`;
		let res = `to_date('${tiempo}','YYYY-MM-DD HH24:MI:SS')`;
		return res;
    }
    
    public static async convert(text:String)  {
        text = text.replace(/'/g,"");
        return text;
        /*let buff = Buffer.alloc(text.length,text.toString(),'latin1');
        //let buff = new Buffer(text.toString(), 'latin1');        
        let utf8 = iconv.decode(buff,'utf8');
        let enc = iconv.encode(utf8,'latin1');
        return iconv.decode(enc, 'latin1');*/
    }
}