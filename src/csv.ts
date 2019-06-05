import * as fs from "fs";
import { ExtendedRow } from "./snapshot";

export function csv(filepath: string, rows: ExtendedRow[], headers = false) {
    if (!rows.length) throw new Error("[rows] has no entries")

    const writer = fs.createWriteStream(filepath);
    if (headers) writer.write(Object.keys(rows[0]).join(",") + "\n")

    for (const row of rows) {
        const rowValues = Object.values(row).join(",")
        writer.write(rowValues + "\n")
    }
}
