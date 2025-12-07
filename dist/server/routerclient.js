"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); //Request, 
const base_1 = require("../base/base");
const channels_1 = __importDefault(require("../controllers/channels"));
const router = (0, express_1.Router)();
exports.default = router;
/*Request for manifests HLS */
router.get('/frx/*', [(0, base_1.validOrigin)('console')], channels_1.default.ssai);
