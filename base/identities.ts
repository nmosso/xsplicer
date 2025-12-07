
import { Router, Request, Response } from 'express'; //Request, 
import pgsql from '../pgsql/pgsql';
import debug from './debug'
import jwt from './jwt'
import {rpl,generateAuthToken} from './base'

const authTokens:any = {};

export default class Identities {
    
    public static login  = (username: string, password:string, apikey:string,domain:string, method:string = 'email', operator:any = {}) => {
        return new Promise(async (response, reject) => { 
            let func  = 'login';
            pgsql.CUD(`${func}`,'$1::jsonb,$2::text,$3::jsonb',[{username,password},{method,apikey,domain},operator]).then((data)=>{
                //Response JWT Info
                let resp = jwt.sign(data,60*60*1);

                response(resp);
            }).catch((err:any) => {
                reject(err)
            })
        });
    }
}