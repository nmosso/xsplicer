
import { Router, Request, Response, query } from 'express'; //Request, 

import pgsql from './pgsql';
import debug from '../base/debug'
import { url } from 'inspector';
import { Platform } from '../models/models';
export interface Path {
    sportid:string,theme:string,path:string
}

export default class Params {
//******************************************************************************************* */
//Origins
    //private origins: origintype[] = [];
    //private urljwts: urljwttype[] = [];
    public urls = [];
    //public paths:Path[] = [];
    public platforms:Platform[] = [];
    public Parameters = [];


    constructor() {
        debug.info(`Params constructor`);
        this.getcrossurls();
        //this.getpaths();
        this.getParameters();
        this.getPlatforms();
        
    }
    public set = (key: string, valor: string) => {
        pgsql.CUD('setparam', '$1::varchar,$2::varchar', [key, valor]).then(() => {
            return true;
        }).catch(() => {
            return false;
        })

    }
    public get = (key: string): string | undefined => {
        const found = this.Parameters.find(param => param[key] !== undefined);
        return found ? found[key] : undefined;
    }
    public getAll() {
        debug.info(`Get Origins`);
        this.getcrossurls();
        //this.getpaths();
        this.getPlatforms();
        this.getParameters();
        return this.urls;
    }
     getcrossurls = () => {
        debug.info(`Get URLS`)
        let [data, params, operator] = ['{}','{}','{}'];
        pgsql.exec('getcrossurls',data, params, operator).then((info:any) => {
            console.log('GET URLS from DB for crossdomain info'); 
            this.urls = info.urls;
            //console.log(this.urls);
        }).catch((err: any) => {
            console.log(err)
            return err
        });
       
    } 

    getPlatforms = () => {
        debug.info(`Get platforms`)
        //let [data, params, operator] = ['{}','{}','{}'];
        pgsql.CUD('getplatforms','',[]).then((platforms:any) => {
            console.log('GETplatforms from DB for crossdomain info'); 
            //console.log(platforms)
            this.platforms = platforms.platforms;
        }).catch((err: any) => {
            console.log(err)
            return err
        });
       
    }    
    getParameters = () => {
        debug.info(`Get getParameters`)
        //let [data, params, operator] = ['{}','{}','{}'];
        pgsql.CUD('getparameters', '', []).then((resp: any) => {
            console.log('GET Parameters');
            //console.log(platforms)
            this.Parameters = resp.parameters;
        }).catch((err: any) => {
            console.log(err)
            return err
        });

    } 
    public updateFromDatabase(msg:any) {
        console.log(`Update from database : ${msg}`);
        if (msg == 'update:crossurls') {
            this.getcrossurls();
        }  else if (msg == 'update:platforms') {
            this.getPlatforms();
        } else if (msg == 'update:params') {
            this.getParameters();
        }
    }

 

}