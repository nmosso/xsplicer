
import debug  from '../base/debug';
import express = require('express');
import path = require('path');
import https = require('https');
import fs = require('fs');
import Params from '../pgsql/parameters';
import Redis from '../pgsql/redis';

let cors:any  =  require('cors')

const bodyParser = require('body-parser');
export let RedisBase = new Redis();


export default class Server {
    public static params:Params;
    public app: express.Application;
    public port: number;

    constructor (port: number) {

        this.port = port;
        //Server.fastPort = fastPort;

        this.app = express();

        this.app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
        this.app.use(bodyParser.urlencoded({ limit: '50mb',extended: true })); // support encoded bodies
        
        let corsOptions = {origin: '*', //credentials: true , 
          methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
          allowedHeaders: ['Content-Type', 'Authorization','fingerprint','apikey'] // Headers permitidos};
        }
        this.app.use(cors(corsOptions));
        
    }

    static init(port: number) {
          
        return new Server(port);
    }



    async start (callback: Function) {
      console.log(`Starting Server at ${this.port} `)

      this.app.listen(this.port);

    }

    public static async startDB () {
      Server.params = new Params();
    }
    public static  sleep(ms:number) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }
}
