"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pgsql_1 = __importDefault(require("./pgsql"));
const debug_1 = __importDefault(require("../base/debug"));
class Params {
    constructor() {
        //******************************************************************************************* */
        //Origins
        //private origins: origintype[] = [];
        //private urljwts: urljwttype[] = [];
        this.urls = [];
        //public paths:Path[] = [];
        this.platforms = [];
        this.Parameters = [];
        this.set = (key, valor) => {
            pgsql_1.default.CUD('setparam', '$1::varchar,$2::varchar', [key, valor]).then(() => {
                return true;
            }).catch(() => {
                return false;
            });
        };
        this.get = (key) => {
            const found = this.Parameters.find(param => param[key] !== undefined);
            return found ? found[key] : undefined;
        };
        this.getcrossurls = () => {
            debug_1.default.info(`Get URLS`);
            let [data, params, operator] = ['{}', '{}', '{}'];
            pgsql_1.default.exec('getcrossurls', data, params, operator).then((info) => {
                console.log('GET URLS from DB for crossdomain info');
                this.urls = info.urls;
                //console.log(this.urls);
            }).catch((err) => {
                console.log(err);
                return err;
            });
        };
        this.getPlatforms = () => {
            debug_1.default.info(`Get platforms`);
            //let [data, params, operator] = ['{}','{}','{}'];
            pgsql_1.default.CUD('getplatforms', '', []).then((platforms) => {
                console.log('GETplatforms from DB for crossdomain info');
                //console.log(platforms)
                this.platforms = platforms.platforms;
            }).catch((err) => {
                console.log(err);
                return err;
            });
        };
        this.getParameters = () => {
            debug_1.default.info(`Get getParameters`);
            //let [data, params, operator] = ['{}','{}','{}'];
            pgsql_1.default.CUD('getparameters', '', []).then((resp) => {
                console.log('GET Parameters');
                //console.log(platforms)
                this.Parameters = resp.parameters;
            }).catch((err) => {
                console.log(err);
                return err;
            });
        };
        debug_1.default.info(`Params constructor`);
        this.getcrossurls();
        //this.getpaths();
        this.getParameters();
        this.getPlatforms();
    }
    getAll() {
        debug_1.default.info(`Get Origins`);
        this.getcrossurls();
        //this.getpaths();
        this.getPlatforms();
        this.getParameters();
        return this.urls;
    }
    updateFromDatabase(msg) {
        console.log(`Update from database : ${msg}`);
        if (msg == 'update:crossurls') {
            this.getcrossurls();
        }
        else if (msg == 'update:platforms') {
            this.getPlatforms();
        }
        else if (msg == 'update:params') {
            this.getParameters();
        }
    }
}
exports.default = Params;
