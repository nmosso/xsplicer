export const debugMode = (process.env.OS === 'Windows_NT')?true:(process.env.MODE=='development')?true:(process.env.MODE=='production')?false:true;

export const pgServer = process.env.PGSERVER;
export const pgServerRead = process.env.PGSERVER;
export const pgPort = (process.env.PGPORT !== undefined)? Number(process.env.PGPORT):5432; 
export const pgUser = process.env.PGUSER;
export const pgPass = process.env.PGPASSWORD;
export const pgDatabase = process.env.PGDATABASE;
export const pgListen = process.env.PGLISTEN;

export const dbServer = process.env.DBSERVER;
export const dbPort = (process.env.DBPORT !== undefined)? Number(process.env.DBPORT):3306; 
export const dbUser = process.env.DBUSER;
export const dbPass = process.env.DBPASSWORD;
export const dbDatabase = process.env.DBDATABASE;

export const JWTPrivateKey = './certs/jwt.key'; //(process.env.MODE=='production')?process.env.JWTPrivateKey:'./certs/jwt.key'; //Path a la llave Privada
export const JWTPublicKey = './certs/jwt.pem'; //(process.env.MODE=='production')?process.env.JWTPublicKey:'./certs/jwt.pem';   //Path a la llave Publica


export const gameImagePath = (process.env.GAMEIMAGEPATH !== undefined)? process.env.GAMEIMAGEPATH:'/tmp/images';

export const CLOCK = process.env.CLOCK;
export const debugDB = (process.env.DEBUGDB=='true');
export const debugLevel = (process.env.DEBUGLEVEL !== undefined) ? Number(process.env.DEBUGLEVEL) : 63;
export const serverPort = (process.env.PORT !== undefined)? Number(process.env.PORT):4880;
export const NUMSTARTCHANNELS = (process.env.NUMSTARTCHANNELS !== undefined) ? Number(process.env.NUMSTARTCHANNELS) : 10;
export const fastPort = (process.env.FASTPORT !== undefined)? Number(process.env.FASTPORT):8080;
export const redisConn = (process.env.REDISCONN !== undefined) ? process.env.REDISCONN : '';
export const maxConsoleRequests = (process.env.MAXCONSOLEREQUESTS !== undefined) ? Number(process.env.MAXCONSOLEREQUESTS) : 10;
export const logAstraMonitor = (process.env.LOGASTRAMONITOR !== undefined) ? (process.env.LOGASTRAMONITOR) : 'disabled';

export const DOWNLOADIMAGES = (process.env.DOWNLOADIMAGES !== undefined) ? Number(process.env.DOWNLOADIMAGES) : 0;

export const pathXuiImage = (process.env.PATHXUIIMAGE !== undefined)?process.env.PATHXUIIMAGE:'/home/xui/www/images';
export const LocalMount = (process.env.LOCALMOUNT !== undefined)?process.env.LOCALMOUNT:'/mnt/media/live';
export const ConsoleURL = (process.env.CONSOLEURL !== undefined)?process.env.CONSOLEURL:'http://10.8.0.2:8080';

/*
Inventario de Puertos:
Nginx: 80 + 443
local xClient: 8040


*/