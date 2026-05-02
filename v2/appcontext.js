
export class AppContext{
    static set context(value){
        Object.assign(_context,value);
    }
    static get context(){
        return _context;
    }
}
const localStorageCache = {};
let _nodeRequire = null;
    try { _nodeRequire = require; } catch {}
if (!_nodeRequire && typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js ESM context: require() isn't a global, build one from module.createRequire
    try {
        const m = process.getBuiltinModule('module');
        _nodeRequire = m.createRequire(import.meta.url);
    } catch {}
}
const getServerStore = () => {
    const Store = _nodeRequire(AppContext.context.serverStorePath);
    return new Store({
        configName: 'localStorage',
        defaults: {}
    });
}
class LocalStorage{
    
    set(key,value){
        if(!value){
            this.delete(key);
            return;
        }
        localStorageCache[key] = value;
        try{
            localStorage.setItem(key,value);
        }catch(error){
            try{
                console.log("Saving to local storage",key, value);
                getServerStore().set(key,value);                
            }catch{
                console.error("Can't save to local storage",error);
                throw error;
            }
        }
    }
    delete(key){        
        delete localStorageCache[key];
        try{
            localStorage.removeItem(key);
        }catch(error){
            try{
                console.error("Removing from local storage",key);
                getServerStore().remove(key);
            }catch{
                console.error("Can't delete from local storage",error);
                throw error;
            }
        }
    }
    setObject(key,value){
        this.set(key,JSON.stringify(value));
    }
    get(key){
        if(localStorageCache.hasOwnProperty(key)) return localStorageCache[key];

        try{
            let value = localStorage.getItem(key);
            if(value == "null"){
                value = null;
            }
            return value;
        }catch(error){
            try{
                if(!AppContext.context.serverStorePath){
                    console.log("Can't get from local storage: serverStorePath not set yet", key);
                    return null;
                }
                return getServerStore().get(key);
            }catch(innerError){
                console.error("Can't get from local storage",key,innerError);
                return null;
            }
        }
    }
    getBoolean(key){
        const raw = this.get(key);
        if(!raw) return false;

        if(raw == "false") return false;
        return true;
    }
    getObject(key){
        return JSON.parse(this.get(key));
    }
}
var _context = {
    "localStorage":new LocalStorage(),
    "isThisDevice":device => _context.getMyDeviceId() == device.deviceId,
    "getMyDeviceId":() => _context.localStorage.get("myDeviceId"),
    "setMyDeviceId":deviceId => _context.localStorage.set("myDeviceId",deviceId),
    "serverStorePath":"",
    "allowUnsecureContent":false
};