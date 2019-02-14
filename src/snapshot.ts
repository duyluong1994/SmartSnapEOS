import { getTableScopes } from "./eos"
import { getStateTableScopes } from "./dfuse"
import { stats, spinner } from "./config"

interface Balance {
    balance: string;
}

interface Results {
    scope: string,
    balance: string
}

export async function snapshot(account: string, block_num: number) {
    const table = "accounts";
    const tableScopes = getTableScopes(account, table, 1000)
    const results: Results[] = [];

    while (true) {
        const {done, value} = await tableScopes.next()
        if (done) break;
        const stateTableScopes = await getStateTableScopes<Balance>(account, value, table, block_num)

        for (const table of stateTableScopes.tables) {
            for (const row of table.rows) {
                results.push({scope: table.scope, balance: row.json.balance})
                stats.accounts += 1
                if (stats.accounts % 1000 === 0) spinner.start(`downloading [${account}] token snapshot (${stats.accounts})`);
            }
        }
    }
    return results
}
