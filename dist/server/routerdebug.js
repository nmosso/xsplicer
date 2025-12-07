"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("../base/debug"));
const express_1 = require("express"); //Request, 
const server_1 = __importDefault(require("./server"));
const router = (0, express_1.Router)();
exports.default = router;
let debugInfo = { xSplicer: 'on', version: '1.0.1' };
router.get('/debug/params', (req, res) => {
    let All = server_1.default.params.getAll();
    res.send({ status: "ok", origins: All });
});
router.get('/debug/level', (req, res) => {
    console.log(`Debug level  ${debug_1.default.debugLevel}}`);
    res.send({ status: "ok", level: debug_1.default.debugLevel });
});
router.post('/debug/level/:level', (req, res) => {
    let level = req.params.level;
    debug_1.default.debugLevel = Number.parseInt(level);
    console.log(`Updating debug level to ${level}`);
    res.send({ status: "ok", level: debug_1.default.debugLevel });
});
router.get('/debug/info', (req, res, next) => {
    console.log(`Debug info:`);
    console.log(debugInfo);
    res.send(debugInfo);
});
router.get('/debug/request', (req, res, next) => {
    console.log(req);
    res.send(debugInfo);
});
