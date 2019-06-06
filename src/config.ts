import axios from "axios";
import * as dotenv from "dotenv";

class Settings {
    public BLOCK_NUMBER: number | undefined;
    public CODE: string | undefined;
    public TABLE: string | undefined;
    public EXCLUDE_ACCOUNTS: string[] = [];
    public DFUSE_API_KEY = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NTI3NjM4MzQsImp0aSI6IjU4ZmIzZDY3LTI4NmItNDEyZC05NWI5LWQ1YWYyMjA5NTQ0MyIsImlhdCI6MTU1MDE3MTgzNCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJDaVFBNmNieWV6NUxNUGNSQzZrZm1GbVhqWTNGSzlOR21LK3h6QVNrSXZBZXhCeXZBeGtTUVFBL0NMUnRCUVlvazh6ZFZkb2VVejJlZ1FmSU15TnR0Z3QyVExPdWdIVVUrUjhkdzVka1JRSjNjWVZEaFdyakVwZ0VlSDd5clVYOGZIUHlFVm1scENvZSIsInRpZXIiOiJiZXRhLXYxIiwidiI6MX0.s1K7pt-8oxRswnMimZO2TunrlMByL-gcGG0v2UNQ-FF53qldjLjkK1--NgUq_W3Lk9AQmjYMQdooGmRDDeNEng";
    public EOSIO_ENDPOINT= "https://eos.greymass.com";
    public DFUSE_ENDPOINT = "https://mainnet.eos.dfuse.io";
    public MIN_BALANCE = 0;
    public CSV_HEADERS = false;
    public JSON = false;
    public BALANCE_INTEGER = false;
}

export const settings = new Settings()

export function config(options: {
    BLOCK_NUMBER?: number,
    DFUSE_API_KEY?: string,
    EOSIO_ENDPOINT?: string,
    DFUSE_ENDPOINT?: string,
    CODE?: string,
    TABLE?: string,
    JSON?: boolean,
    CSV_HEADERS?: boolean,
} = {}) {
    dotenv.config()

    settings.BLOCK_NUMBER = Number(options.BLOCK_NUMBER || process.env.BLOCK_NUMBER || settings.BLOCK_NUMBER);
    settings.DFUSE_API_KEY = options.DFUSE_API_KEY || process.env.DFUSE_API_KEY || settings.DFUSE_API_KEY
    settings.EOSIO_ENDPOINT = options.EOSIO_ENDPOINT || process.env.EOSIO_ENDPOINT || settings.EOSIO_ENDPOINT
    settings.DFUSE_ENDPOINT = options.DFUSE_ENDPOINT || process.env.DFUSE_ENDPOINT || settings.DFUSE_ENDPOINT
    settings.CODE = options.CODE || process.env.CODE || settings.CODE
    settings.TABLE = options.TABLE || process.env.TABLE || settings.TABLE
    settings.JSON = options.JSON || JSON.parse(process.env.JSON || "false") || settings.JSON;
    settings.CSV_HEADERS = options.CSV_HEADERS || JSON.parse(process.env.CSV_HEADERS || "false") || settings.CSV_HEADERS;
    axios.defaults.headers = {'Authorization': `Bearer ${settings.DFUSE_API_KEY}`}
    axios.defaults.paramsSerializer = (params) => Object.keys(params).map(key => key + "=" + params[key]).join("&")
}

config()