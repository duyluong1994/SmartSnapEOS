import axios from "axios";
import debug from "debug";
import { settings } from "./config"

const log = debug("easysnap:dfuse")

export interface StateTable<T> {
    last_irreversible_block_id: string;
    last_irreversible_block_num: number;
    rows: StateTableRow<T>[];
}

export interface StateTableRow<T> {
    key: string;
    payer: string;
    json: T;
}

export interface StateTableScopes<T> {
    last_irreversible_block_id: string;
    last_irreversible_block_num: number;
    tables: TableScopes<T>[];
}

export interface TableScopes<T> {
    account: string;
    scope: string;
    rows: TableScopesRow<T>[];
}

export interface TableScopesRow<T> {
    key: string;
    payer: string;
    json: T;
}

export async function getStateTable<T>(account: string, scope: string, table: string, block_num: number) {
    log(`getTableByScope    ${JSON.stringify({account, scope, table, block_num})}`)
    const params = {
        account,
        table,
        scope,
        block_num,
        json: true
    }
    try {
        const response = await axios.get<StateTable<T>>(`${settings.DFUSE_ENDPOINT}/v0/state/table`, {params})
        return response.data
    } catch (e) {
        throw new Error(e)
    }
}

export async function getStateTableScopes<T>(account: string, scopes: string[], table: string, block_num: number) {
    log(`getTableByScope    ${JSON.stringify({account, scopes: scopes.length, table, block_num})}`)
    const params = {
        account,
        table,
        scopes: scopes.join('|'),
        block_num,
        json: true
    }
    try {
        const response = await axios.get<StateTableScopes<T>>(`${settings.DFUSE_ENDPOINT}/v0/state/tables/scopes`, {params})
        return response.data
    } catch (e) {
        throw new Error(e)
    }
}
