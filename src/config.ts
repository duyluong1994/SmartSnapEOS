import axios from "axios";
import * as dotenv from "dotenv";
import ora from "ora";
import BigNumber from "bignumber.js"

class Settings {
    public BLOCK_NUMBER: number | undefined;
    public TOKEN_CODE: string | undefined;
    public EXCLUDE_ACCOUNTS: string[] = [];
    public DFUSE_API_KEY = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NTI3NjM4MzQsImp0aSI6IjU4ZmIzZDY3LTI4NmItNDEyZC05NWI5LWQ1YWYyMjA5NTQ0MyIsImlhdCI6MTU1MDE3MTgzNCwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJDaVFBNmNieWV6NUxNUGNSQzZrZm1GbVhqWTNGSzlOR21LK3h6QVNrSXZBZXhCeXZBeGtTUVFBL0NMUnRCUVlvazh6ZFZkb2VVejJlZ1FmSU15TnR0Z3QyVExPdWdIVVUrUjhkdzVka1JRSjNjWVZEaFdyakVwZ0VlSDd5clVYOGZIUHlFVm1scENvZSIsInRpZXIiOiJiZXRhLXYxIiwidiI6MX0.s1K7pt-8oxRswnMimZO2TunrlMByL-gcGG0v2UNQ-FF53qldjLjkK1--NgUq_W3Lk9AQmjYMQdooGmRDDeNEng";
    public TOKEN_TABLE = "accounts";
    public EOSIO_ENDPOINT= "https://eos.greymass.com";
    public DFUSE_ENDPOINT = "https://mainnet.eos.dfuse.io";
    public MIN_BALANCE = 0;
    public HEADERS = false;
    public JSON = false
}

export const stats: {[key: string]: BigNumber} = {
    accounts_active: new BigNumber(0),
    accounts_total: new BigNumber(0),
    accounts_skipped: new BigNumber(0),
    balance_active: new BigNumber(0),
    balance_total: new BigNumber(0),
    balance_skipped: new BigNumber(0),
}

export const settings = new Settings()
export const spinner = ora();

export function config(options: {
    BLOCK_NUMBER?: number,
    DFUSE_API_KEY?: string,
    EOSIO_ENDPOINT?: string,
    DFUSE_ENDPOINT?: string,
    MIN_BALANCE?: number,
    TOKEN_CODE?: string,
    TOKEN_TABLE?: string,
    EXCLUDE_ACCOUNTS?: string[],
    JSON?: boolean,
    HEADERS?: boolean,
} = {}) {
    dotenv.config()

    settings.MIN_BALANCE = Number(options.MIN_BALANCE || process.env.MIN_BALANCE || settings.MIN_BALANCE);
    settings.BLOCK_NUMBER = Number(options.BLOCK_NUMBER || process.env.BLOCK_NUMBER || settings.BLOCK_NUMBER);
    settings.DFUSE_API_KEY = options.DFUSE_API_KEY || process.env.DFUSE_API_KEY || settings.DFUSE_API_KEY
    settings.EOSIO_ENDPOINT = options.EOSIO_ENDPOINT || process.env.EOSIO_ENDPOINT || settings.EOSIO_ENDPOINT
    settings.DFUSE_ENDPOINT = options.DFUSE_ENDPOINT || process.env.DFUSE_ENDPOINT || settings.DFUSE_ENDPOINT
    settings.TOKEN_CODE = options.TOKEN_CODE || process.env.TOKEN_CODE || settings.TOKEN_CODE
    settings.TOKEN_TABLE = options.TOKEN_TABLE || process.env.TOKEN_TABLE || settings.TOKEN_TABLE
    settings.EXCLUDE_ACCOUNTS = options.EXCLUDE_ACCOUNTS || (process.env.EXCLUDE_ACCOUNTS || "").split(",") || settings.EXCLUDE_ACCOUNTS
    settings.JSON = options.JSON || Boolean(process.env.JSON) || settings.JSON
    settings.HEADERS = options.HEADERS || Boolean(process.env.HEADERS) || settings.HEADERS
    axios.defaults.headers = {'Authorization': `Bearer ${settings.DFUSE_API_KEY}`}
    axios.defaults.paramsSerializer = (params) => Object.keys(params).map(key => key + "=" + params[key]).join("&")
}

config()