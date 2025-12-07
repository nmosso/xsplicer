
import { debugMode, debugLevel } from '../config/config';

export interface erresponse {
    error: boolean ,
    errcode: string,
    errmessage: string
  }
export enum ErrLevel {
    
    None = 0,
    Info = 1,
    Sql = 2,
    Error = 4,
    Warning = 8,
    Debug = 16,
    DeepSQL = 32,
    Max = 64-1
}
export default class debug {
    //0: No Log
    //4: Muestra encabezado de las funciones
    //5: Muestra debug dentro de las funciones
    
    public static debugLevel: number = debugLevel; // (debugMode)?ErrLevel.Info+ErrLevel.Error+ErrLevel.Sql: ErrLevel.Info+ErrLevel.Error+ErrLevel.Sql; 

    public static async SetErrLevel(Level:number) {
        this.debugLevel = this.debugLevel | Level;
    }
    public static async UnsetErrLevel(Level:number) {
        this.debugLevel = this.debugLevel & (ErrLevel.Max ^ Level);
    }

   public static async dolog(msg:any, level:any = 1, country:string = 'BR') {
       if (level <= this.debugLevel) // && this.countries.find(element => element == country) !== undefined)
        console.log(`${msg}`);
   }
   public static async log(msg:any, level:any = 1, country:string='BR') {
        this.dolog(msg,level,country);
    }
    public static async Log(msg:any, level:any = 1, country:string='BR') {
       if (level >= this.debugLevel )
       this.log(msg,level,country);
    }

    public static async info(msg:any, level:any = ErrLevel.Info, country:string='BR') {
        if (level & this.debugLevel )
        this.log(msg,level,country);
    }
    public static async infosql(msg:any, level:any = ErrLevel.Sql, country:string='BR') {
        if (level & this.debugLevel )
        this.log(msg,level,country);
    }
    public static async error(msg:any, level:any = ErrLevel.Error, country:string='BR') {
        if (level & this.debugLevel )
        this.log(msg,level,country);
    }
    public static async warning(msg:any, level:any = ErrLevel.Warning, country:string='BR') {
        if (level & this.debugLevel )
        this.log(msg,level,country);
    }
    public static async debug(msg:any, level:any = ErrLevel.Debug, country:string='BR') {
        if (level & this.debugLevel )
        this.log(msg,level,country);
    }
    public static async deepsql(msg:any, level:any = ErrLevel.DeepSQL, country:string='BR') {
        if (level & this.debugLevel )
        this.log(msg,level,country);
    }

    public static async DBResponse(code:string, message:string) : Promise<erresponse> {
        return new Promise(async (response, reject) => { 
            try {
                response({
                    error:true, 
                    errcode:code, 
                    errmessage:message
                });
            } catch(error) {
                console.log(`Error in error!`);
                console.log(error)
                let errcode = '9999';
                let errmessage = 'Unknown Error';
                response({error:true, errcode, errmessage});
                //response(`{error:true, errcode:${errcode}, errmessage:'${errmessage}'}`);
            }
        });
    }


}

