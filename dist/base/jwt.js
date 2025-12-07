"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const JWT = require('jsonwebtoken');
const config_1 = require("../config/config");
/*
Generate Keys at:
http://www.csfieldguide.org.nz/en/interactives/rsa-key-generator/index.html
http://travistidwell.com/jsencrypt/demo/
*/
const fs = require('fs');
class jwt2 {
    static sign(payload, exp) {
        if (payload.iat === undefined) {
            payload.iat = Math.floor(Date.now() / 1000);
            if (exp !== undefined && exp > 0 && payload.exp === undefined) {
                payload.exp = payload.iat + exp;
            }
        }
        return JWT.sign(payload, this.privateKEY, this.signOptions);
    }
    static verify(mytoken) {
        try {
            let token = `${mytoken.split('.')[0]}.${mytoken.split('.')[1]}.${mytoken.split('.')[2]}`;
            let acDate = Math.floor(Date.now() / 1000);
            let decode = JWT.decode(token, this.publicKEY);
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
_a = jwt2;
jwt2.privateKEY = fs.readFileSync(config_1.JWTPrivateKey, 'utf8');
jwt2.publicKEY = fs.readFileSync(config_1.JWTPublicKey, 'utf8');
jwt2.i = 'Very Usefull Software'; // Issuer 
jwt2.s = 'some@user.com'; // Subject 
jwt2.a = 'http://veryusefull.software'; // Audience
/*
    private static signOptions = {
        issuer:  this.i,
        subject:  this.s,
        audience:  this.a,
        expiresIn:  "12h",
        algorithm:  "RS256"
       };
*/
jwt2.signOptions = {
    algorithm: "RS256"
};
jwt2.publickey = (req, res) => {
    res.send({ status: 'success', publickey: _a.publicKEY });
};
exports.default = jwt2;
