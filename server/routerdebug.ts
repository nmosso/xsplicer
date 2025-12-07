import debug from '../base/debug';
import {Router,Request, Response, response} from 'express'; //Request, 

import authapi from '../base/authapi';
import Server from './server';


const router = Router();
export default  router;


let debugInfo ={xSplicer:'on',version:'1.0.1'};

router.get('/debug/params',  (req: Request, res:Response) => {
    let All = Server.params.getAll();
    res.send({status:"ok",origins:All});
});

router.get('/debug/level',  (req: Request, res:Response) => {
    console.log(`Debug level  ${debug.debugLevel}}`)
    res.send({status:"ok",level:debug.debugLevel});
});

router.post('/debug/level/:level',  (req: Request, res:Response) => {
    let level = req.params.level;
    debug.debugLevel = Number.parseInt(level);
    console.log(`Updating debug level to ${level}`)
    res.send({status:"ok",level:debug.debugLevel});
});
router.get('/debug/info', (req: Request, res:Response, next:Function) => {
    
    console.log(`Debug info:`)
    console.log(debugInfo);
    res.send(debugInfo);
});

router.get('/debug/request', (req: Request, res:Response, next:Function) => {
    console.log(req)
    res.send(debugInfo);
});
