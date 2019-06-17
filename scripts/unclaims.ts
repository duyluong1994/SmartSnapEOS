import fs from 'fs'
// @ts-ignore
import CsvReadableStream from 'csv-reader'
import BigNumber from 'bignumber.js';
import { decomposeAsset, AssetSymbol, formatAsset } from '../src/asset';

type ClaimableTokenAccountExtendedRow = {
    scope: string
    payer: string
    claimed: boolean
    balance: string
}

const args = process.argv.slice(2)
if(args.length === 0) {
  console.log(`Usage: Pass a file path to this script as first argument`)
}

if(!fs.existsSync(args[0])) {
    console.error(`File "${args[0]}" does not exist`)
}
const inputStream = fs.createReadStream(args[0], 'utf8');

let numUnclaimed = 0
let numClaimed = 0
let symbol:AssetSymbol
let amountUnclaimed:BigNumber = new BigNumber(0)
let amountClaimed:BigNumber = new BigNumber(0)

inputStream
    .pipe(CsvReadableStream({ parseNumbers: false, parseBooleans: true, trim: true }))
    .on('data', (row:any) => {
        if(Array.isArray(row)) {
            row = {
                scope: row[0],
                ramPayer: row[1],
                claimed: row[2],
                balance: row[3],
            }
        }
        // console.log('A row arrived: ', row);
        const { amount, symbol: s } = decomposeAsset(row.balance)
        symbol = s
        if(row.claimed) {
            numClaimed += 1
            amountClaimed = amountClaimed.plus(amount)
        } else {
            numUnclaimed += 1
            amountUnclaimed = amountUnclaimed.plus(amount)
        }
    })
    .on('end', function () {
        console.log(JSON.stringify({
            numUnclaimed,
            numClaimed,
            numTotal: numUnclaimed + numClaimed,
            amountUnclaimed: formatAsset({ amount: amountUnclaimed, symbol}, { withSymbol: true, separateThousands: true }),
            amountClaimed: formatAsset({ amount: amountClaimed, symbol}, { withSymbol: true, separateThousands: true }),
            amountTotal: formatAsset({ amount: amountUnclaimed.plus(amountClaimed), symbol}, { withSymbol: true, separateThousands: true }),
        }, null, 2))
    });