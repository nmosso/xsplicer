import {serverPort,debugMode } from './config/config'; //,debugMode
import debug from './base/debug';
import pgsql from './pgsql/pgsql';
import routerdebug from './server/routerdebug';
import routerclient from './server/routerclient';
import Server from './server/server';

import Clock from './base/clock'

//0: No Log
//4: Muestra encabezado de las funciones
//5: Muestra debug dentro de las funciones
console.log(`===========================================================================`)
let debugLevel:number = 0; 
if (debugMode == undefined) {
    debug.error(`Error Starting, ENV MODE not defined
    Edit the /etc/envirnment or /etc/prodile.d/otash.sh file and add export DEVMODE=devel or export DEVMODE=production
    `);

    process.exit();
} else {
    if (debugMode) console.log('Running in DEVEL model'); else console.log('Running in PRODUCTION model');
}

pgsql.instance;
//mySql.instance;
//redis.instance;
new Clock();

const server = Server.init(serverPort);
server.app.use(routerdebug);
server.app.use(routerclient);



server.start(() => {
    debug.info(`Server Listening on port ${serverPort}`);
});
