import axios from "axios";
import { settings } from "./config"
import { logger } from "./logger"
import { Abi } from "@dfuse/client";

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

export async function getTableByScope(code: string, table: string, limit = 1000, lowerBound = '') {
    logger.debug(`getTableByScope    ${code},${table},${limit},${lowerBound}`)
    const url = `${settings.EOSIO_ENDPOINT}/v1/chain/get_table_by_scope`;
    const data = {
        json: true,
        code: code,
        table: table,
        limit: limit,
        lower_bound: ` ${lowerBound}`,
        key_type: `name`
    }
    try {
        return await axios.post<Table<Scope>>(url, data);
    } catch (e:any) {
        throw new Error(e)
    }
}

export async function * getTableScopesBroken(code: string, table: string, limit = 1000) {
    logger.debug(`getTableScopes    ${code},${table}`)
    let hasMore = false;
    do {
        let lowerBound = ''
        const response = await getTableByScope(code, table, limit, lowerBound);
        hasMore = Boolean(response.data.more);
        lowerBound = hasMore ? response.data.more : lowerBound
        yield response.data.rows.map(row => row.scope)
    } while (hasMore);
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
    logger.debug(`getInfo`)
    const url = `${settings.EOSIO_ENDPOINT}/v1/chain/get_info`;
    try {
        return await axios.post<Info>(url);
    } catch (e:any) {
        throw new Error(e)
    }
}

export interface GetAbiResult {
    account_name: string;
    abi: Abi;
}
export async function getAbi(name: string) {
    logger.debug(`getInfo`)
    const url = `${settings.EOSIO_ENDPOINT}/v1/chain/get_abi`;
    const data = {
        account_name: name,
    }

    try {
        return await axios.post<GetAbiResult>(url, data);
    } catch (e:any) {
        throw new Error(e)
    }
}
