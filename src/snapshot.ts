import { getTablesByScopes, getTableScopes } from "./dfuse"
import { stats } from "./config"
import { sleep } from "./utils"
import { logger } from "./logger"

export interface Balance {
    balance: string;
}

export type ExtendedRow = {
    scope: string
    [key: string]: any;
}


const MAX_SCOPES_TO_PROCESS = 1e2

export async function snapshot(code: string, table: string, block_num: number) {
    let tableScopes: string[] = []
    // while (true) {
    //     const tableScopesIterator = getTableScopes(code, table, 1000)
    //     const {done, value} = await tableScopesIterator.next()
    //     tableScopes.push(...value)
    //     logger.info(`Fetched scopes ${tableScopes.length} ${tableScopes.slice(-1)}`)
    //     if (done) break;
    // }
    tableScopes = (await getTableScopes(code, table, block_num)).scopes
    logger.info(`Fetched scopes ${tableScopes.length} ${tableScopes.slice(0,1)}-${tableScopes.slice(-1)}`)
    
    const rows: ExtendedRow[] = [];
    let currentScopes = tableScopes.splice(0, MAX_SCOPES_TO_PROCESS)

    while(currentScopes.length > 0) {
        try {
            const profiler = logger.startTimer();
            const stateTableScopes = await getTablesByScopes<Balance>(code, table, currentScopes, block_num)
            for (const table of stateTableScopes.tables) {
                for (const row of table.rows) {
                    // Total stats
                    stats.accounts_total = stats.accounts_total.plus(1)
                    rows.push({scope: table.scope, ...row.json})
                    stats.accounts_active = stats.accounts_active.plus(1);
                }
            }
            profiler.done({ message: `downloading [${code}] token snapshot (${stats.accounts_active})` });
            currentScopes = tableScopes.splice(0, MAX_SCOPES_TO_PROCESS)
        } catch (error) {
            sleep(1000)
            logger.error(`Could not fetch scopes. ${error.message}`)
        }
    }
    return rows
}
