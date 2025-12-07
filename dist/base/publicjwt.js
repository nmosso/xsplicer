"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JWT = require('jsonwebtoken');
//import {origintype} from '../controllers/parameters'
/*
Generate Keys at:
http://www.csfieldguide.org.nz/en/interactives/rsa-key-generator/index.html
http://travistidwell.com/jsencrypt/demo/
*/
const fs = require('fs');
class publicJWT {
    static sign(payload, exp, JWTPrivateKey) {
        if (payload.iat === undefined) {
            payload.iat = Math.floor(Date.now() / 1000);
            if (exp !== undefined && exp > 0 && payload.exp === undefined) {
                payload.exp = payload.iat + exp;
            }
        }
        return JWT.sign(payload, JWTPrivateKey, this.signOptions);
    }
    static verify(mytoken, JWTPublicKey) {
        try {
            let token = `${mytoken.split('.')[0]}.${mytoken.split('.')[1]}.${mytoken.split('.')[2]}`;
            let acDate = Math.floor(Date.now() / 1000);
            let decode = JWT.decode(token, JWTPublicKey);
            console.log(`Decoded Payload`);
            console.log(decode);
            if (decode.iat !== undefined) {
                if (decode.iat > acDate) {
                    return { status: 'error', errcode: 401, errmessage: 'Invalid date' };
                }
                else if (decode.exp !== undefined) {
                    if (decode.iat + decode.exp < acDate) {
                        return { status: 'error', errcode: 401, errmessage: 'expired' };
                    }
                }
            }
            return { status: 'success', payload: decode };
        }
        catch (err) {
            return { status: 'error', errcode: 403, errmessage: 'invalid token' };
        }
    }
}
publicJWT.signOptions = {
    algorithm: "RS256"
};
publicJWT.publickey = (req, res, JWTPublicKey) => {
    let payload = req.params[0];
    let prefix = payload.split('/')[1];
    res.send({ status: 'success', publickey: JWTPublicKey });
};
exports.default = publicJWT;
