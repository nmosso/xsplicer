import { Router, Request, Response } from 'express'; //Request, 
const JWT = require('jsonwebtoken');
//import {JWTPrivateKey, JWTPublicKey} from '../config/config' ;
import Server from '../server/server';
//import {origintype} from '../controllers/parameters'

/*
Generate Keys at:
http://www.csfieldguide.org.nz/en/interactives/rsa-key-generator/index.html
http://travistidwell.com/jsencrypt/demo/
*/
const fs = require('fs')


export default class publicJWT {
    
    private static signOptions = {
        algorithm:  "RS256"
    };
    public static publickey  = (req: Request, res: Response,JWTPublicKey:any) => {
        
        let payload = req.params[0];
        let prefix = payload.split('/')[1];
        res.send({status:'success',publickey:JWTPublicKey})
        
    }
    public static sign(payload:any, exp:number|undefined, JWTPrivateKey:string) {

        if (payload.iat === undefined) {
           
            payload.iat = Math.floor(Date.now() /1000);
            if (exp !== undefined && exp > 0 && payload.exp === undefined) {
                payload.exp = payload.iat + exp;
            }
        }        
        return JWT.sign(payload,JWTPrivateKey ,this.signOptions);
    }
    public static verify(mytoken:any, JWTPublicKey:string) {
        try {
          
            let token =  `${mytoken.split('.')[0]}.${mytoken.split('.')[1]}.${mytoken.split('.')[2]}`
            let acDate = Math.floor(Date.now() /1000);
            let decode = JWT.decode(token,JWTPublicKey);
            console.log(`Decoded Payload`)
            console.log(decode);
            if (decode.iat !== undefined) {
                if (decode.iat > acDate) {
                    return {status:'error', errcode:401,errmessage:'Invalid date'};
                } else if (decode.exp !== undefined) {
                    if (decode.iat+decode.exp < acDate) {
                        return {status:'error', errcode:401,errmessage:'expired'};
                    }
                }
            }
            return {status:'success',payload:decode};
        } catch(err:any) {
            return {status:'error', errcode:403,errmessage:'invalid token'};
        }
    }
}