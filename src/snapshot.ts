import { getTablesByScopes, getTableScopes } from "./dfuse";
import { store } from "./stats";
import { sleep } from "./utils";
import { logger } from "./logger";
import { getDatabase } from "./db";

export interface Balance {
  balance: string;
}

export type ExtendedRow = {
  scope: string;
  [key: string]: any;
};

const MAX_SCOPES_TO_PROCESS = 900;

export async function* snapshot(
  code: string,
  table: string,
  block_num: number
) {
  const db = getDatabase()!;

  let tableScopes: string[] = db
    .get("scopes")
    .cloneDeep()
    .value();
  if (tableScopes.length > 0) {
    let lastScopeIndex = 0;
    const lastScopeProcessed = db.get("lastScopeProcessed").value();
    if (lastScopeProcessed) {
      lastScopeIndex = tableScopes.findIndex(
        scope => scope === lastScopeProcessed
      );
    }
    
    store.dispatch({
      type: `SET_SCOPES`,
      payload: {
        scopesTotal: tableScopes.length,
        scopesProcessed: lastScopeIndex + 1,
        lastScopeProcessed,
      }
    });
    logger.info(
      `Using scopes from db (#${tableScopes.length}): ${tableScopes.slice(
        0,
        1
        )}-${tableScopes.slice(-1)}`
        );
  
    tableScopes.splice(0, lastScopeIndex + 1);
  } else {
    // while (true) {
    //     const tableScopesIterator = getTableScopes(code, table, 1000)
    //     const {done, value} = await tableScopesIterator.next()
    //     tableScopes.push(...value)
    //     logger.info(`Fetched scopes ${tableScopes.length} ${tableScopes.slice(-1)}`)
    //     if (done) break;
    // }
    tableScopes = (await getTableScopes(code, table, block_num)).scopes;

    logger.info(
      `Fetched scopes (#${tableScopes.length}): ${tableScopes.slice(
        0,
        1
      )}-${tableScopes.slice(-1)}`
    );

    // db tracks references, make sure to create a copy
    db.set("scopes", tableScopes.slice())
      .cloneDeep()
      .write();
      store.dispatch({
        type: `SET_SCOPES`,
        payload: {
          scopesTotal: tableScopes.length,
          scopesProcessed: 0,
          lastScopeProcessed: '',
        }
      });
  }

  let currentScopes = tableScopes.splice(0, MAX_SCOPES_TO_PROCESS);

  while (currentScopes.length > 0) {
    try {
      const rows: ExtendedRow[] = [];
      const stateTableScopes = await getTablesByScopes<any>(
        code,
        table,
        currentScopes,
        block_num
      );
      for (const table of stateTableScopes.tables) {
        for (const row of table.rows) {
          // Total stats
          rows.push({ scope: table.scope, ...row.json });
        }
      }
      
      store.dispatch({
        type: `PROCESS_ROWS`,
        payload: {
          tables: stateTableScopes.tables
        }
      });
      logger.info(`processed new rows (${store.getState().scopesProcessed})`);

      yield rows;

      db.set("lastScopeProcessed", currentScopes.slice(-1)[0]).write();
      currentScopes = tableScopes.splice(0, MAX_SCOPES_TO_PROCESS);
    } catch (error) {
      sleep(1000);
      logger.error(`Could not fetch scopes. ${error.message}`);
    }
  }
}
