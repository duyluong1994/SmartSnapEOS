import { getStateTableScopes, getStateTable } from "./dfuse"
import { stats, spinner } from "./config"
import debug from "debug";

const log = debug("easysnap:eosdac")

export interface Balance {
    balance: string;
}

export interface Member {
    sender: string,
    agreedtermsversion: number
}

export interface Account {
    // account name
    account_name: string
    // token balance
    balance: string
}

export async function eosdac(code: string, block_num: number, min_balance = 0, exclude_accounts: string[] = [], balance_integer = false) {
    log(`eosdac    ${JSON.stringify({code, block_num, min_balance, exclude_accounts})}`)
    const tableScopes = (await getStateTable<Member>(code, code, "members", block_num)).rows.map(row => row.json.sender)
    const accounts: Account[] = [];
    let chunks = 0

    while (true) {
        const scopes = tableScopes.slice(chunks, chunks + 1000)
        chunks += 1000
        if (!scopes.length) break;

        const stateTableScopes = await getStateTableScopes<Balance>(code, scopes, "accounts", block_num)

        for (const table of stateTableScopes.tables) {
            for (const row of table.rows) {
                const balance = row.json.balance;
                const account_name = table.scope;
                const amount = Number(balance.split(" ")[0])

                // Total stats
                stats.accounts_total = stats.accounts_total.plus(1)
                stats.balance_total = stats.balance_total.plus(amount)

                // Account name must not belong to excluded accounts
                if (exclude_accounts.indexOf(account_name) !== -1) {
                    log(`skipped    ${account_name}    account has been flaged as an excluded account`)
                    stats.accounts_skipped = stats.accounts_skipped.plus(1)
                    stats.balance_skipped = stats.balance_skipped.plus(amount)
                    continue;
                }
                // Must have at least the minimum balance
                if (amount < min_balance) {
                    log(`skipped    ${account_name}    account does not have the minimum balance`)
                    stats.balance_skipped = stats.balance_skipped.plus(amount)
                    stats.accounts_skipped = stats.accounts_skipped.plus(1)
                    continue;
                }
                accounts.push({account_name, balance: balance_integer ? String(amount) : balance})
                stats.accounts_active = stats.accounts_active.plus(1);
                stats.balance_active = stats.balance_active.plus(amount)
            }
        }
        spinner.start(`downloading [${code}] token snapshot (${stats.accounts_active})`);
    }
    return accounts
}
