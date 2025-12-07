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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
const debug_1 = __importDefault(require("./debug"));
class Clock {
    constructor() {
        if (config_1.CLOCK == 'true')
            setInterval(this.timeouts.bind(this), 24 * 60 * 60 * 1000);
    }
    timeouts() {
        return __awaiter(this, void 0, void 0, function* () {
            debug_1.default.debug('message Timeouts');
            //Update Gracenote
        });
    }
}
exports.default = Clock;
