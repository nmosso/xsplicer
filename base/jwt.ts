import { Router, Request, Response } from 'express'; //Request, 
const JWT = require('jsonwebtoken');
import {JWTPrivateKey, JWTPublicKey} from '../config/config' ;

/*
Generate Keys at:
http://www.csfieldguide.org.nz/en/interactives/rsa-key-generator/index.html
http://travistidwell.com/jsencrypt/demo/
*/
const fs = require('fs')

export default class jwt2 {
    
    private static privateKEY  = fs.readFileSync(JWTPrivateKey, 'utf8');
    private static publicKEY  = fs.readFileSync(JWTPublicKey, 'utf8');
    private static i  = 'Very Usefull Software';          // Issuer 
    private static s  = 'some@user.com';        // Subject 
    private static a  = 'http://veryusefull.software'; // Audience
/*
    private static signOptions = {
        issuer:  this.i,
        subject:  this.s,
        audience:  this.a,
        expiresIn:  "12h",
        algorithm:  "RS256"
       };
*/
    private static signOptions = {
        algorithm:  "RS256"
    };
    public static publickey  = (req: Request, res: Response) => {
    
        res.send({status:'success',publickey:this.publicKEY})
    }
    public static sign(payload:any, exp:number|undefined) {
        if (payload.iat === undefined) {
            payload.iat = Math.floor(Date.now() /1000);
            if (exp !== undefined && exp > 0 && payload.exp === undefined) {
                payload.exp = payload.iat + exp;
            }
        }        
        return JWT.sign(payload,this.privateKEY,this.signOptions);
    }
    public static verify(mytoken:any) {
        try {
            let token =  `${mytoken.split('.')[0]}.${mytoken.split('.')[1]}.${mytoken.split('.')[2]}`
            let acDate = Math.floor(Date.now() /1000);
            let decode = JWT.decode(token,this.publicKEY);
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