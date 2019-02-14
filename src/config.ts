import axios from "axios";
import * as dotenv from "dotenv";
import ora from "ora";

class Settings {
    public BLOCK_NUMBER: number | undefined;
    public DFUSE_API_KEY: string | undefined;
    public TOKEN_CONTRACT: string | undefined;
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
    TOKEN_CONTRACT?: string,
} = {}) {
    dotenv.config()

    settings.BLOCK_NUMBER = options.BLOCK_NUMBER || Number(process.env.BLOCK_NUMBER)
    settings.DFUSE_API_KEY = options.DFUSE_API_KEY || process.env.DFUSE_API_KEY || settings.DFUSE_API_KEY
    settings.EOSIO_ENDPOINT = options.EOSIO_ENDPOINT || process.env.EOSIO_ENDPOINT || settings.EOSIO_ENDPOINT
    settings.DFUSE_ENDPOINT = options.DFUSE_ENDPOINT || process.env.DFUSE_ENDPOINT || settings.DFUSE_ENDPOINT
    settings.TOKEN_CONTRACT = options.TOKEN_CONTRACT || process.env.TOKEN_CONTRACT || settings.TOKEN_CONTRACT

    if (!settings.DFUSE_API_KEY) throw new Error("[DFUSE_API_KEY] is required in .env");
    if (!settings.BLOCK_NUMBER) throw new Error("[BLOCK_NUMBER] is required in .env");
    if (!settings.EOSIO_ENDPOINT) throw new Error("[EOSIO_ENDPOINT] is required in .env");
    if (!settings.DFUSE_ENDPOINT) throw new Error("[DFUSE_ENDPOINT] is required in .env");
    if (!settings.TOKEN_CONTRACT) throw new Error("[TOKEN_CONTRACT] is required in .env");

    axios.defaults.headers = {'Authorization': `Bearer ${settings.DFUSE_API_KEY}`}
    axios.defaults.paramsSerializer = (params) => Object.keys(params).map(key => key + "=" + params[key]).join("&")
}

config()
