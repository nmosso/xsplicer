import { createClient } from 'redis';
import { redisConn } from '../config/config';

export default class Redis {
    private static _instance: Redis;

    private client = createClient({
        url: redisConn
    });

    private conectado: boolean = false;

    constructor() {
        if (redisConn !== "") {
            this.client = createClient({
                url: redisConn
            });
            this.conectado = false;
            this.client.on('error',(err:any)=>{
                console.log('Redis Client Error', err);
            });
            this.client.connect();
            console.log('Start Redis Local Connection')
        }
    }

    public static get instance() {
        return this._instance || (this._instance= new this());
    }
    public async set(key:any, value:any) {
        //console.log(`Redis save ${key} ${JSON.stringify(value)}`);
        this.client.set(key,JSON.stringify(value));
    }
    public async get(key:any):Promise<any> {
        return new Promise(async (resolve, reject) => { 
            //console.log(`Redis recover ${key}`)
            await this.client.get(key).then(async (value:any)=> {
                if (value !== null) 
                    resolve(JSON.parse(value));
                else reject({error:true,message:`value returned by redis is null`});
            });
        });
    }
    public async exists(key:any) {
        //console.log(`Redis check ${key}`);
        return new Promise(async (resolve, reject) => { 
            //console.log(`Redis recover ${key}`)
            await this.client.get(key).then(()=> {
                resolve(true);
            }).catch(()=>{
                resolve(false)
            })
        });
    }

    public async clearall(channelid:number =0) {
        //console.log(`Redis check ${key}`);
        return new Promise(async (resolve, reject) => {
            //console.log(`Redis recover ${key}`)
            if (channelid > 0) {
                await this.client.flushAll().then(() => {
                    resolve(true);
                }).catch((err) => {
                    console.log(err)
                    resolve(false)
                })
            } else {
                resolve(true);
            }

        });
    }
}