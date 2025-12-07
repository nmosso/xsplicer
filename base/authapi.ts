
import { Router, Request, Response } from 'express'; //Request, 
import pgsql from '../pgsql/pgsql';
import debug from './debug'
import utils from './utils'
import publicJWT from './publicjwt'
import JWT from './jwt'

export default class AuthApi {

    public static login  = (req: Request, res: Response) => {
        
        debug.info(`Auth Device with User / password`)
        
        let [data, params, operator] = utils.getparams(req);
        let domain = utils.getCorsDomain(req);
        operator = {operator: 'System', ip: req.ip, apikey: req.params._apikey,domain}
        data['apikey'] = req.params._apikey;
        debug.info(`Params from retest : ${JSON.stringify(data)}}`)

        let iat = Math.floor(Date.now() /1000);
        let exp = iat+60*60*4;
        data['iat'] = iat;
        data['epx'] = exp;

        pgsql.exec('identitieslogin',data, params, operator).then(async (info:any) => {
            console.log(info);
            let token = await JWT.sign(info,exp);
            res.send({token, name:info.name, role:info.role});
        }).catch((err: any) => {
            res.status(404).send(err)
        });
    }
    public static register  = (req: Request, res: Response) => {

        debug.info(`Auth Register with User / password`)

        let [data, params, operator] = utils.getparams(req);
        operator = {operator: 'System', ip: req.ip, apikey: req.params._apikey}
        data['apikey'] = req.params._apikey;
        debug.info(`Params from retest : ${JSON.stringify(data)}}`)
        let expiration = Math.floor(Date.now() /1000)+60*60*24;
        let token = JWT.sign(data,60*60*24);
        data['jwt'] = token;

        pgsql.exec('identitiesgerister',data, params, operator).then((info:any) => {
            //console.log(info);
            res.send({token,expiration});
        }).catch((err: any) => {
            res.status(404).send(err)
        });
       
    }

    
}