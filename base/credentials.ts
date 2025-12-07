import { debugMode } from '../config/config';
import pgsql from '../pgsql/pgsql';
import {Router, Request, Response} from 'express';
import jwt from './jwt';
import debug from './debug'
import superagent from 'superagent';
import publicJWT from './publicjwt';
import { JWTPublicKey} from '../config/config' ;
import {ip} from '../base/base';
import Server from '../server/server';
import { Platform } from '../models/models';
import base64url from 'base64url';

export interface respuesta {
    status: number ,
    message: string,
    indata:data|undefined
  }
export  interface data {
    ip:string,
    name:string,
}

   let ValidateIPaddress = (IpAddr: string) => 
    {  
        return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(IpAddr));
    }


export default class credentials {
    private launchers:string[] = [];
    private apikeys:string[] = [];


    public check( _apikey:any) {
        let index =  this.apikeys.indexOf(_apikey);
        if (index >=0) {
            return this.launchers[index];
        }
        return undefined;
    }
    public static async checkOperatorAuth(req: Request) {
        return new Promise(async (resolve, reject) => {
            console.log(`header:`, req.headers.authorization)
            if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
                reject({ status: 401, message: 'Missing Authorization Header' })
                
            } else {
                console.log(`Data Acquired`)
                const base64Credentials = req.headers.authorization.split(' ')[1];
                const credentials = JSON.parse(base64url.decode(base64Credentials.trim()));
                //const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                req.body._auth = credentials
                console.log(`Credentials`,credentials)
                resolve({ status: 200});
            }
        });
    }

    public static async checkToken (req:Request) {
        return new Promise(async (resolve, reject) => {
            if (!req.headers.authorization ) {
                reject({status:401,message:'Missing Authorization Header'})
            } else {
                resolve( {status:200,message:"Authorized", identityid:'neutral'});
            }
        });
    }
    public static async checkApikey (req:Request) {
        return new Promise(async (resolve, reject) => {
            
            if (!req.headers.apikey) {
                reject({status:401,message:'Missing Authentication Header'})
            }
            if (req.headers.apikey == undefined) {
                reject({status:401,message:'Missing Authentication Header'})
            } else {
                let apikey:string = '';
                if (typeof req.headers.apikey !== 'string') {
                    apikey = req.headers.apikey[0];
                } else {
                    apikey = req.headers.apikey;
                }
                console.log(Server.params.platforms);

                let platform:Platform|undefined= Server.params.platforms.find((platform:Platform)=> platform.apikey === apikey);
                if (platform === undefined) {
                    reject({status:403,message:'Not Athenicated'}) //reject(err)
                } else {
                    req.body._auth = {apikey:platform.apikey,lcoid:platform.lcoid,authmethod:platform.authmethod,ipvalidation:platform.ipvalidation,expires:platform.expires};
                    req.headers.authinfo = apikey
                    resolve(platform)
                    
                }
            }
        });
    }
public static async siteApikey (req:Request) {
        return new Promise(async (resolve, reject) => {
            
            if (!req.headers.apikey) {
                reject({status:401,message:'Missing Authentication Header'})
            }
            if (req.headers.apikey == undefined) {
                reject({status:401,message:'Missing Authentication Header'})
            } else {
                let apikey:string = '';
                if (typeof req.headers.apikey !== 'string') {
                    apikey = req.headers.apikey[0];
                } else {
                    apikey = req.headers.apikey;
                }
                console.log(Server.params.platforms);

                
                if (apikey === undefined) {

                    reject({status:403,message:'Not Athenicated'}) //reject(err)
                } else {
                    req.body._auth = {apikey};
                    req.headers.authinfo = apikey
                    resolve({apikey})
                    
                }
            }
        });
    }
    public static async checkAuth (req:Request) {
        return new Promise(async (resolve, reject) => {
            
            if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
                reject({status:401,message:'Missing Authorization Header'})
            }
            if (req.headers.authorization == undefined) {
                reject({status:401,message:'Missing Authorization Header'})
            } else {
                const base64Credentials =  req.headers.authorization.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [identityid, secret] = credentials.split(':');
                pgsql.CUD('identityauthorise','$1::varchar,$2::varchar',[identityid,secret]).then((res)=>{
                    debug.debug(`Auth Done`)
                    debug.debug(res);
                    req.body._auth = {identityid,secret};
                    resolve( {status:200,message:"Authorised", identityid});
                }).catch((err)=>{
                    debug.error(err)
                    reject({status:403,message:'Not Authorised'})
                })
                
            }
        });
    }
    
    public static async checkUser (req:Request) {
        return new Promise(async (resolve, reject) => {
            
            if (req.headers.Authorization !== undefined) {
                let basic = req.headers.Authorization.indexOf('Basic ');
                let bearer = req.headers.Authorization.indexOf('Bearer ');
                if ( basic !== undefined || bearer !== undefined ) {
                    if (req.headers.Authorization.length === 0) {
                        reject({status:401,message:'Missing Authorization Parameters'})
                        return;
                    } 
                    console.log(`Authorization Header Found`)     
                    const base64Credentials =  req.headers.Authorization[bearer].split(' ')[1];
                    const creds = Buffer.from(base64Credentials, 'base64').toString('ascii');
                    const [identityid, secret] = creds.split(':');
                    pgsql.CUD('identityexists','$1::varchar',[identityid]).then((res)=>{
                        debug.debug(`Auth Pass`)
                        debug.debug(res);
                        req.body._auth = {identityid,secret};
                        resolve( {status:200,message:"Identified", identityid});
                    }).catch((err)=>{
                        debug.error(err)
                        reject({status:401,message:'Not Found'})
                    })
                } else {
                    reject({status:401,message:'Missing Authorization'})
                }
            } else {
                console.log(`No Authorization Header`, req.headers)
                reject({status:401,message:'Missing Authorization Header'})
            }
        });
    }

    public static async checkJWT (req:Request) {
        return new Promise(async (resolve, reject) => {
            debug.debug(`headers`)
            debug.debug(JSON.stringify(req.headers));
            if (!req.headers.authorization) {
                reject({status:401,message:'Missings Authorization Header'})
            } else if (req.headers.authorization.indexOf('Bearer ') === -1) {
                reject({status:401,message:'Missing Authorization Header'})
            } else {
                const originJWT =  req.headers.authorization.split(' ')[1];
                const credentials = publicJWT.verify(originJWT,JWTPublicKey);
                debug.debug(`origin JWT`)
                debug.debug(JSON.stringify(originJWT));
                debug.debug(`credentials`)
                debug.debug(JSON.stringify(credentials));
                if (credentials.status !== 'success') {
                    reject({status:401,message:'Missing Authorization'})
                } else {
                    req.body._auth = {
                        identityid: credentials.payload.yid,
                        email: credentials.payload.email,
                        role: credentials.payload.role,
                        walletid:credentials.payload.wll,
                        domain:credentials.payload.domain
                    }
                    //req.body._jwt = credentials.payload;
                    resolve( {status:200,message:"Authorised", identityid: credentials.payload.yid});
                }
            }
        });
    }
}