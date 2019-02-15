import { getTableScopes } from "./eos"
import { getStateTableScopes } from "./dfuse"
import { stats, spinner } from "./config"

export interface Balance {
    balance: string;
}

export interface Account {
    // account name
    account_name: string
    // token balance
    balance: string
}

export async function snapshot(account: string, block_num: number, min_balance = 0) {
    const table = "accounts";
    const tableScopes = getTableScopes(account, table, 1000)
    const accounts: Account[] = [];

    while (true) {
        const {done, value} = await tableScopes.next()
        if (done) break;
        const stateTableScopes = await getStateTableScopes<Balance>(account, value, table, block_num)

        for (const table of stateTableScopes.tables) {
            for (const row of table.rows) {
                const balance = row.json.balance;
                const account_name = table.scope;
                const amount = Number(balance.split(" ")[0])

                if (amount >= min_balance) {
                    accounts.push({account_name, balance})
                    stats.accounts += 1;
                    stats.balance = stats.balance.plus(amount)
                } else {
                    stats.skipped += 1;
                }
                stats.total += 1;
            }
        }
        spinner.start(`downloading [${account}] token snapshot (${stats.accounts})`);
    }
    return accounts
}
