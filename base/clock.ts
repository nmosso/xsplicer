
import pgsql from '../pgsql/pgsql';
import {CLOCK} from '../config/config'
import debug from './debug'
export default class Clock {
    
    constructor()  {
        if (CLOCK == 'true') setInterval(this.timeouts.bind(this) ,24*60*60*1000); 
    }

    async timeouts() {
        debug.debug('message Timeouts');
        //Update Gracenote
        
    }
}
