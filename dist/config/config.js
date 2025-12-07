"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleURL = exports.LocalMount = exports.pathXuiImage = exports.DOWNLOADIMAGES = exports.logAstraMonitor = exports.maxConsoleRequests = exports.redisConn = exports.fastPort = exports.NUMSTARTCHANNELS = exports.serverPort = exports.debugLevel = exports.debugDB = exports.CLOCK = exports.gameImagePath = exports.JWTPublicKey = exports.JWTPrivateKey = exports.dbDatabase = exports.dbPass = exports.dbUser = exports.dbPort = exports.dbServer = exports.pgListen = exports.pgDatabase = exports.pgPass = exports.pgUser = exports.pgPort = exports.pgServerRead = exports.pgServer = exports.debugMode = void 0;
exports.debugMode = (process.env.OS === 'Windows_NT') ? true : (process.env.MODE == 'development') ? true : (process.env.MODE == 'production') ? false : true;
exports.pgServer = process.env.PGSERVER;
exports.pgServerRead = process.env.PGSERVER;
exports.pgPort = (process.env.PGPORT !== undefined) ? Number(process.env.PGPORT) : 5432;
exports.pgUser = process.env.PGUSER;
exports.pgPass = process.env.PGPASSWORD;
exports.pgDatabase = process.env.PGDATABASE;
exports.pgListen = process.env.PGLISTEN;
exports.dbServer = process.env.DBSERVER;
exports.dbPort = (process.env.DBPORT !== undefined) ? Number(process.env.DBPORT) : 3306;
exports.dbUser = process.env.DBUSER;
exports.dbPass = process.env.DBPASSWORD;
exports.dbDatabase = process.env.DBDATABASE;
exports.JWTPrivateKey = './certs/jwt.key'; //(process.env.MODE=='production')?process.env.JWTPrivateKey:'./certs/jwt.key'; //Path a la llave Privada
exports.JWTPublicKey = './certs/jwt.pem'; //(process.env.MODE=='production')?process.env.JWTPublicKey:'./certs/jwt.pem';   //Path a la llave Publica
exports.gameImagePath = (process.env.GAMEIMAGEPATH !== undefined) ? process.env.GAMEIMAGEPATH : '/tmp/images';
exports.CLOCK = process.env.CLOCK;
exports.debugDB = (process.env.DEBUGDB == 'true');
exports.debugLevel = (process.env.DEBUGLEVEL !== undefined) ? Number(process.env.DEBUGLEVEL) : 63;
exports.serverPort = (process.env.PORT !== undefined) ? Number(process.env.PORT) : 4880;
exports.NUMSTARTCHANNELS = (process.env.NUMSTARTCHANNELS !== undefined) ? Number(process.env.NUMSTARTCHANNELS) : 10;
exports.fastPort = (process.env.FASTPORT !== undefined) ? Number(process.env.FASTPORT) : 8080;
exports.redisConn = (process.env.REDISCONN !== undefined) ? process.env.REDISCONN : '';
exports.maxConsoleRequests = (process.env.MAXCONSOLEREQUESTS !== undefined) ? Number(process.env.MAXCONSOLEREQUESTS) : 10;
exports.logAstraMonitor = (process.env.LOGASTRAMONITOR !== undefined) ? (process.env.LOGASTRAMONITOR) : 'disabled';
exports.DOWNLOADIMAGES = (process.env.DOWNLOADIMAGES !== undefined) ? Number(process.env.DOWNLOADIMAGES) : 0;
exports.pathXuiImage = (process.env.PATHXUIIMAGE !== undefined) ? process.env.PATHXUIIMAGE : '/home/xui/www/images';
exports.LocalMount = (process.env.LOCALMOUNT !== undefined) ? process.env.LOCALMOUNT : '/mnt/media/live';
exports.ConsoleURL = (process.env.CONSOLEURL !== undefined) ? process.env.CONSOLEURL : 'http://10.8.0.2:8080';
/*
Inventario de Puertos:
Nginx: 80 + 443
local xClient: 8040


*/ 
