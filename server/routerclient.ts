import debug from '../base/debug';
import {Router,Request, Response, response} from 'express'; //Request, 
import {checkApikey, siteApikey, checkAuth,checkJWT,checkToken,checkUser,validOrigin}  from '../base/base'


import Channels from '../controllers/channels'

const router = Router();
export default  router;


/*Request for manifests HLS */
router.get('/fre/*',[validOrigin('console')], Channels.ssai);



