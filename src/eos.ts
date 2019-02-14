import axios from "axios";
import debug from "debug";
import { settings } from "./config"

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
    debug("snapshot:eos")(`eos.getTableByScope    ${code},${table},${limit},${more}`)
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
    debug("snapshot:eos")(`eos.getTableScopes    ${code},${table}`)
    let more = '';
    do {
        const response = await getTableByScope(code, table, limit, more);
        more = response.data.more;
        yield response.data.rows.map(row => row.scope)
    } while (more);
}
