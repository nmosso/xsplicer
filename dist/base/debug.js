"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrLevel = void 0;
const config_1 = require("../config/config");
var ErrLevel;
(function (ErrLevel) {
    ErrLevel[ErrLevel["None"] = 0] = "None";
    ErrLevel[ErrLevel["Info"] = 1] = "Info";
    ErrLevel[ErrLevel["Sql"] = 2] = "Sql";
    ErrLevel[ErrLevel["Error"] = 4] = "Error";
    ErrLevel[ErrLevel["Warning"] = 8] = "Warning";
    ErrLevel[ErrLevel["Debug"] = 16] = "Debug";
    ErrLevel[ErrLevel["DeepSQL"] = 32] = "DeepSQL";
    ErrLevel[ErrLevel["Max"] = 63] = "Max";
})(ErrLevel || (exports.ErrLevel = ErrLevel = {}));
class debug {
    static SetErrLevel(Level) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debugLevel = this.debugLevel | Level;
        });
    }
    static UnsetErrLevel(Level) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debugLevel = this.debugLevel & (ErrLevel.Max ^ Level);
        });
    }
    static dolog(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = 1, country = 'BR') {
            if (level <= this.debugLevel) // && this.countries.find(element => element == country) !== undefined)
                console.log(`${msg}`);
        });
    }
    static log(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = 1, country = 'BR') {
            this.dolog(msg, level, country);
        });
    }
    static Log(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = 1, country = 'BR') {
            if (level >= this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static info(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = ErrLevel.Info, country = 'BR') {
            if (level & this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static infosql(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = ErrLevel.Sql, country = 'BR') {
            if (level & this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static error(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = ErrLevel.Error, country = 'BR') {
            if (level & this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static warning(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = ErrLevel.Warning, country = 'BR') {
            if (level & this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static debug(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = ErrLevel.Debug, country = 'BR') {
            if (level & this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static deepsql(msg_1) {
        return __awaiter(this, arguments, void 0, function* (msg, level = ErrLevel.DeepSQL, country = 'BR') {
            if (level & this.debugLevel)
                this.log(msg, level, country);
        });
    }
    static DBResponse(code, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((response, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    response({
                        error: true,
                        errcode: code,
                        errmessage: message
                    });
                }
                catch (error) {
                    console.log(`Error in error!`);
                    console.log(error);
                    let errcode = '9999';
                    let errmessage = 'Unknown Error';
                    response({ error: true, errcode, errmessage });
                    //response(`{error:true, errcode:${errcode}, errmessage:'${errmessage}'}`);
                }
            }));
        });
    }
}
//0: No Log
//4: Muestra encabezado de las funciones
//5: Muestra debug dentro de las funciones
debug.debugLevel = config_1.debugLevel; // (debugMode)?ErrLevel.Info+ErrLevel.Error+ErrLevel.Sql: ErrLevel.Info+ErrLevel.Error+ErrLevel.Sql; 
exports.default = debug;
