
import { Router, Request, Response } from 'express'; //Request, 
import pgsql from '../pgsql/pgsql';
import debug from './debug'

const crypto = require('crypto')

export interface AccountPath {
    secret:string,
    cdnpath:string
}

export interface AccountPaths {
    accountid:string,
    accountpath:AccountPath
}


export default class Assets {

    public static APaths:AccountPaths[] = [];

    public static updatePaths = () => {
        return new Promise(async (response, reject) => { 
            pgsql.CUD(`getAccountPaths`,'',[]).then((data:any)=>{
                this.APaths.splice(this.APaths.length);
                this.APaths.push(data);
                response({status:"ok"})
            }).catch((err:any) => {
                reject(err)
            })
        });       
    }

    public static gentoken = (password:string, asset:string,ip:string,time:string, cdnkey:string ='' ) => {
        return new Promise (async (response, reject) => {
            try {
                let concat = `${password.trim()}${asset.trim()}${ip.trim()}${time.trim}${cdnkey}`;
                let hash = crypto.createHash('md5').update(concat).digest("hex")
                response(hash);
            } catch(err:any) {
                reject(err)
            }
        });        
    }
    public static checktoken  = (token:string,password:string, asset:string,ip:string,time:string, cdnkey:string ='') => {
        return new Promise(async (response, reject) => {
            try {
                this.gentoken(password,asset,ip,time,cdnkey).then((hash:any)=> {
                    if (hash.trim() ==token.trim()) {
                        response({status:"ok"})
                    } else {
                        reject({status:"error"})
                    }
                })
                
            } catch(err:any) {
                reject(err)
            }
        });        
    }

    public static async responselog(info:any) {
        return new Promise(async (response, reject) => { 
            console.log(`=====================================================`)
            console.log(`==> RESPONSE LOG `)
            console.log(`=====================================================`)
            console.log(info)
            console.log(`=====================================================`)
            pgsql.CUD(`dblog`,'$1::jsonb',[info]).then((data:any)=>{
                response({status:"success"})
            }).catch((err:any) => {
                console.log(`=====================================================`)
                console.log(`==> Fatal error in DB log `)
                console.log(`=====================================================`)
                console.log(err)
                console.log(`=====================================================`)
                response({status:"fail"})
            })
        });
    }
    
    public static async responseloginfo(data:any, info:any) {
        return new Promise(async (response, reject) => { 
            //console.log(`Exec responselog`)
            //console.log(info);
            pgsql.CUD(`dblog`,'$1::jsonb,$2::jsonb',[data,info]).then((data:any)=>{
                response({status:"success"})
            }).catch((err:any) => {
                console.log(`=====================================================`)
                console.log(`==> Fatal error in DB log `)
                console.log(`=====================================================`)
                console.log(err)
                console.log(`=====================================================`)
                response({status:"fail"})
            })
        });
    }

}
