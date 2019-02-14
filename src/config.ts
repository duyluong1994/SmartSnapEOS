import axios from "axios";
import * as dotenv from "dotenv";
import ora from "ora";

class Settings {
    public BLOCK_NUMBER: number | undefined;
    public TOKEN_CODE: string | undefined;
    public DFUSE_API_KEY = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NTI3NjM4MzQsImp0aSI6IjU4ZmIzZDY3LTI4NmItNDEyZC05NWI5LWQ1YWYyMjA5NTQ0MyIsImlhdCI6MTU1MDE3MTgzNCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJDaVFBNmNieWV6NUxNUGNSQzZrZm1GbVhqWTNGSzlOR21LK3h6QVNrSXZBZXhCeXZBeGtTUVFBL0NMUnRCUVlvazh6ZFZkb2VVejJlZ1FmSU15TnR0Z3QyVExPdWdIVVUrUjhkdzVka1JRSjNjWVZEaFdyakVwZ0VlSDd5clVYOGZIUHlFVm1scENvZSIsInRpZXIiOiJiZXRhLXYxIiwidiI6MX0.s1K7pt-8oxRswnMimZO2TunrlMByL-gcGG0v2UNQ-FF53qldjLjkK1--NgUq_W3Lk9AQmjYMQdooGmRDDeNEng";
    public TOKEN_TABLE = "accounts";
    public EOSIO_ENDPOINT= "https://eos.greymass.com";
    public DFUSE_ENDPOINT = "https://mainnet.eos.dfuse.io";
}

class Stats {
    public accounts = 0;
}

export const settings = new Settings()
export const stats = new Stats()
export const spinner = ora();

export function config(options: {
    BLOCK_NUMBER?: number,
    DFUSE_API_KEY?: string,
    EOSIO_ENDPOINT?: string,
    DFUSE_ENDPOINT?: string,
    TOKEN_CODE?: string,
    TOKEN_TABLE?: string,
} = {}) {
    dotenv.config()

    settings.BLOCK_NUMBER = options.BLOCK_NUMBER || Number(process.env.BLOCK_NUMBER)
    settings.DFUSE_API_KEY = options.DFUSE_API_KEY || process.env.DFUSE_API_KEY || settings.DFUSE_API_KEY
    settings.EOSIO_ENDPOINT = options.EOSIO_ENDPOINT || process.env.EOSIO_ENDPOINT || settings.EOSIO_ENDPOINT
    settings.DFUSE_ENDPOINT = options.DFUSE_ENDPOINT || process.env.DFUSE_ENDPOINT || settings.DFUSE_ENDPOINT
    settings.TOKEN_CODE = options.TOKEN_CODE || process.env.TOKEN_CODE || settings.TOKEN_CODE
    settings.TOKEN_TABLE = options.TOKEN_TABLE || process.env.TOKEN_TABLE || settings.TOKEN_TABLE

    axios.defaults.headers = {'Authorization': `Bearer ${settings.DFUSE_API_KEY}`}
    axios.defaults.paramsSerializer = (params) => Object.keys(params).map(key => key + "=" + params[key]).join("&")
}

config()