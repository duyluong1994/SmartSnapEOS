import * as fs from "fs";
import { Account } from "./snapshot";

export function csv(filepath: string, accounts: Account[], headers = false) {
    if (!accounts.length) throw new Error("[accounts] has no entries")

    const writer = fs.createWriteStream(filepath);
    if (headers) writer.write(Object.keys(accounts[0]).join(",") + "\n")

    for (const account of accounts) {
        const row = Object.values(account).join(",")
        writer.write(row + "\n")
    }
}
