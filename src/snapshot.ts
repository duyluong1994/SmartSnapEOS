import { getTablesByScopes, getTableScopes } from "./dfuse"
import { stats } from "./config"
import { sleep } from "./utils"
import { logger } from "./logger"
import { getDatabase } from "./db"

export interface Balance {
    balance: string;
}

export type ExtendedRow = {
    scope: string
    [key: string]: any;
}


const MAX_SCOPES_TO_PROCESS = 1e2

export async function * snapshot(code: string, table: string, block_num: number) {
    const db = getDatabase()!

    let tableScopes: string[] = db.get('scopes').cloneDeep().value()
    if(tableScopes.length > 0) {
        const lastScopeProcessed = db.get('lastScopeProcessed').value()
        if(lastScopeProcessed) {
            const lastScopeIndex = tableScopes.findIndex(scope => scope === lastScopeProcessed)
            tableScopes.splice(0, lastScopeIndex + 1)
        }
        console.log(`Using scopes from db (#${tableScopes.length}): ${tableScopes.slice(0,1)}-${tableScopes.slice(-1)}`)
    } else {
        // while (true) {
        //     const tableScopesIterator = getTableScopes(code, table, 1000)
        //     const {done, value} = await tableScopesIterator.next()
        //     tableScopes.push(...value)
        //     logger.info(`Fetched scopes ${tableScopes.length} ${tableScopes.slice(-1)}`)
        //     if (done) break;
        // }
        tableScopes = (await getTableScopes(code, table, block_num)).scopes
        logger.info(`Fetched scopes (#${tableScopes.length}): ${tableScopes.slice(0,1)}-${tableScopes.slice(-1)}`)
        // db tracks references, make sure to create a copy
        db.set('scopes', tableScopes.slice()).cloneDeep().write()
    }
    
    let currentScopes = tableScopes.splice(0, MAX_SCOPES_TO_PROCESS)
    
    while(currentScopes.length > 0) {
        try {
            const rows: ExtendedRow[] = [];
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
            yield rows
            db.set('lastScopeProcessed', currentScopes.slice(-1)[0]).write()
            currentScopes = tableScopes.splice(0, MAX_SCOPES_TO_PROCESS)
        } catch (error) {
            sleep(1000)
            logger.error(`Could not fetch scopes. ${error.message}`)
        }
    }
}
