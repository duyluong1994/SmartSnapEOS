import axios from "axios";
import debug from "debug";
import { settings } from "./config"

const log = debug("easysnap:eos")

export interface Table<T> {
    rows: T[],
    more: string
}

export interface Scope {
    code: string;
    scope: string;
    table: string;
    payer: string;
    count: number;
}

export async function getTableByScope(code: string, table: string, limit = 1000, more = "") {
    log(`getTableByScope    ${code},${table},${limit},${more}`)
    const url = `${settings.EOSIO_ENDPOINT}/v1/chain/get_table_by_scope`;
    const data = {
        json: true,
        code: code,
        table: table,
        limit: limit,
        lower_bound: more,
    }
    try {
        return await axios.post<Table<Scope>>(url, data);
    } catch (e) {
        throw new Error(e)
    }
}

export async function * getTableScopes(code: string, table: string, limit = 1000) {
    log(`getTableScopes    ${code},${table}`)
    let more = '';
    do {
        const response = await getTableByScope(code, table, limit, more);
        more = response.data.more;
        yield response.data.rows.map(row => row.scope)
    } while (more);
}

interface Info {
    server_version: string;
    chain_id: string;
    head_block_num: number;
    last_irreversible_block_num: number;
    last_irreversible_block_id: string;
    head_block_id: string;
    head_block_time: string;
    head_block_producer: string;
    virtual_block_cpu_limit: number;
    virtual_block_net_limit: number;
    block_cpu_limit: number;
    block_net_limit: number;
    server_version_string: string;
}

export async function getInfo() {
    log(`getInfo`)
    const url = `${settings.EOSIO_ENDPOINT}/v1/chain/get_info`;
    try {
        return await axios.post<Info>(url);
    } catch (e) {
        throw new Error(e)
    }
}
