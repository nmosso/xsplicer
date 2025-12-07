"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config/config"); //,debugMode
const debug_1 = __importDefault(require("./base/debug"));
const routerdebug_1 = __importDefault(require("./server/routerdebug"));
const routerclient_1 = __importDefault(require("./server/routerclient"));
const server_1 = __importDefault(require("./server/server"));
const clock_1 = __importDefault(require("./base/clock"));
//0: No Log
//4: Muestra encabezado de las funciones
//5: Muestra debug dentro de las funciones
console.log(`===========================================================================`);
let debugLevel = 0;
if (config_1.debugMode == undefined) {
    debug_1.default.error(`Error Starting, ENV MODE not defined
    Edit the /etc/envirnment or /etc/prodile.d/otash.sh file and add export DEVMODE=devel or export DEVMODE=production
    `);
    process.exit();
}
else {
    if (config_1.debugMode)
        console.log('Running in DEVEL model');
    else
        console.log('Running in PRODUCTION model');
}
//pgsql.instance;
//mySql.instance;
//redis.instance;
new clock_1.default();
const server = server_1.default.init(config_1.serverPort);
server.app.use(routerdebug_1.default);
server.app.use(routerclient_1.default);
server.start(() => {
    debug_1.default.info(`Server Listening on port ${config_1.serverPort}`);
});
