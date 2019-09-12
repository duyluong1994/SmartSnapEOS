import fs from "fs";
// @ts-ignore
import CsvReadableStream from "csv-reader";
import { createObjectCsvWriter } from "csv-writer";
// import { settings } from "../src/config";
let settings ={
  BLOCK_NUMBER: 72888888
};

import BigNumber from "bignumber.js";
import { decomposeAsset, AssetSymbol, formatAsset } from "../src/asset";

const EOS_SYMBOL: AssetSymbol = { symbolCode: `EOS`, precision: 4 };

type RowMeta = {
  scope: string;
  ramPayer: string;
};
type AccountsRow = {
  balance: string;
};
type DelbandRow = {
  cpu_weight: string;
  net_weight: string;
  to: string;
  from: string;
};

type RexbalRow = {
  version: number;
  owner: string;
  vote_stake: string;
  rex_balance: string;
  matured_rex: string;
  rex_maturities: string;
};
type RexfundRow = {
  version: number;
  owner: string;
  balance: string;
};

type Account = {
  name: string;
  liquidEOS: BigNumber;
  stakedEOS: BigNumber;
  rexEOS: BigNumber;
  totalEOS: BigNumber;
};

const getFileNames = () => {
  return {
    liquid: `snapshots/eosio.token-accounts-${settings.BLOCK_NUMBER}.csv`,
    stake: `snapshots/eosio-delband-${settings.BLOCK_NUMBER}.csv`,
    rexbal: `snapshots/eosio-rexbal-${settings.BLOCK_NUMBER}.csv`,
    rexfund: `snapshots/eosio-rexfund-${settings.BLOCK_NUMBER}.csv`
  };
};

if (!settings.BLOCK_NUMBER) {
  throw new Error(`No block number specified`);
}

const fileNames = getFileNames();
const accountEOSMap = new Map<string, Account>();
const getOrCreateAccount = (name: string) => {
  if (!accountEOSMap.has(name)) {
    accountEOSMap.set(name, {
      name,
      liquidEOS: new BigNumber(0),
      stakedEOS: new BigNumber(0),
      rexEOS: new BigNumber(0),
      totalEOS: new BigNumber(0)
    });
  }
  return accountEOSMap.get(name)!;
};

const aggregateLiquidEOS = async () =>
  new Promise(resolve => {
    if (!fs.existsSync(fileNames[`liquid`])) {
      throw new Error(`File "${fileNames[`liquid`]}" does not exist`);
    }

    let inputStream = fs.createReadStream(fileNames[`liquid`], "utf8");
    inputStream
      .pipe(
        CsvReadableStream({
          parseNumbers: false,
          parseBooleans: true,
          trim: true
        })
      )
      .on("data", (_row: any) => {
        let row: RowMeta & AccountsRow;
        if (Array.isArray(_row)) {
          row = {
            scope: _row[0],
            ramPayer: _row[1],
            balance: _row[2]
          };
        } else {
          throw new Error(`Something is wrong with this row: ${_row}`);
        }

        const { amount, symbol: s } = decomposeAsset(row.balance);
        const acc = getOrCreateAccount(row.scope);
        acc.liquidEOS = new BigNumber(amount).plus(acc.liquidEOS);
      })
      .on("end", () => resolve());
  });

const aggregateStakedEOS = async () =>
  new Promise(resolve => {
    if (!fs.existsSync(fileNames[`stake`])) {
      throw new Error(`File "${fileNames[`stake`]}" does not exist`);
    }

    let inputStream = fs.createReadStream(fileNames[`stake`], "utf8");
    inputStream
      .pipe(
        CsvReadableStream({
          parseNumbers: false,
          parseBooleans: true,
          trim: true
        })
      )
      .on("data", (_row: any) => {
        let row: RowMeta & DelbandRow;
        if (Array.isArray(_row)) {
          row = {
            scope: _row[0],
            ramPayer: _row[1],
            cpu_weight: _row[2],
            net_weight: _row[3],
            to: _row[4],
            from: _row[5]
          };
        } else {
          throw new Error(`Something is wrong with this row: ${_row}`);
        }

        const { amount: amountCpu } = decomposeAsset(row.cpu_weight);
        const { amount: amountNet } = decomposeAsset(row.net_weight);
        const acc = getOrCreateAccount(row.from);
        acc.stakedEOS = acc.stakedEOS.plus(
          new BigNumber(amountCpu).plus(new BigNumber(amountNet))
        );
      })
      .on("end", () => resolve());
  });

const aggregateRexBalance = async () =>
  new Promise(resolve => {
    if (!fs.existsSync(fileNames[`rexbal`])) {
      throw new Error(`File "${fileNames[`rexbal`]}" does not exist`);
    }

    let inputStream = fs.createReadStream(fileNames[`rexbal`], "utf8");
    inputStream
      .pipe(
        CsvReadableStream({
          parseNumbers: false,
          parseBooleans: true,
          trim: true
        })
      )
      .on("data", (_row: any) => {
        let row: RowMeta & RexbalRow;
        if (Array.isArray(_row)) {
          row = {
            scope: _row[0],
            ramPayer: _row[1],
            rex_maturities: _row[2],
            matured_rex: _row[3],
            rex_balance: _row[4],
            vote_stake: _row[5],
            owner: _row[6],
            version: _row[7]
          };
        } else {
          throw new Error(`Something is wrong with this row: ${_row}`);
        }

        const { amount } = decomposeAsset(row.vote_stake);
        const acc = getOrCreateAccount(row.owner);
        acc.rexEOS = acc.rexEOS.plus(new BigNumber(amount));
      })
      .on("end", () => resolve());
  });

const aggregateRexFund = async () =>
  new Promise(resolve => {
    if (!fs.existsSync(fileNames[`rexfund`])) {
      throw new Error(`File "${fileNames[`rexfund`]}" does not exist`);
    }

    let inputStream = fs.createReadStream(fileNames[`rexfund`], "utf8");
    inputStream
      .pipe(
        CsvReadableStream({
          parseNumbers: false,
          parseBooleans: true,
          trim: true
        })
      )
      .on("data", (_row: any) => {
        let row: RowMeta & RexfundRow;
        if (Array.isArray(_row)) {
          row = {
            scope: _row[0],
            ramPayer: _row[1],
            balance: _row[2],
            owner: _row[3],
            version: _row[4]
          };
        } else {
          throw new Error(`Something is wrong with this row: ${_row}`);
        }

        const { amount } = decomposeAsset(row.balance);
        const acc = getOrCreateAccount(row.owner);
        acc.rexEOS = acc.rexEOS.plus(new BigNumber(amount));
      })
      .on("end", () => resolve());
  });

async function start() {
  try {
    console.log(`Starting`);
    await aggregateLiquidEOS();
    console.log(`Parsed Liquid EOS`, accountEOSMap.size);
    await aggregateStakedEOS();
    console.log(`Parsed Staked EOS`, accountEOSMap.size);
    await aggregateRexBalance();
    await aggregateRexFund();
    console.log(`Parsed REX`, accountEOSMap.size);
  } catch (err) {
    console.error(err.stack);
  }

  for (const [key, value] of accountEOSMap) {
    value.totalEOS = value.liquidEOS.plus(value.stakedEOS).plus(value.rexEOS);
  }

  const records = Array.from(accountEOSMap.values()).sort((a, b) =>
    b.totalEOS.comparedTo(a.totalEOS)
  );

  console.log(`Sorted`);

  const outputFile = ``;
  const csvWriter = createObjectCsvWriter({
    path: `snapshots/EOS_${settings.BLOCK_NUMBER}.csv`,
    header: [`account`, `total`, `liquid`, `stake`, `rex`].map(header => ({
      id: header,
      title: header
    })),
    append: false
  });

  do {
    // need to write in chunks, otherwise out of memory
    let chunk = records.splice(0, 1000);
    await csvWriter.writeRecords(
      chunk.map(val => ({
        account: val.name,
        total: formatAsset(
          { amount: val.totalEOS, symbol: EOS_SYMBOL },
          { withSymbol: false }
        ),
        liquid: formatAsset(
          { amount: val.liquidEOS, symbol: EOS_SYMBOL },
          { withSymbol: false }
        ),
        stake: formatAsset(
          { amount: val.stakedEOS, symbol: EOS_SYMBOL },
          { withSymbol: false }
        ),
        rex: formatAsset(
          { amount: val.rexEOS, symbol: EOS_SYMBOL },
          { withSymbol: false }
        )
      }))
    );
  } while (records.length > 0);
}

/**
 * Requires the following snapshots to be there for the blocknumber
 * eosio.token-accounts
 * eosio-delband
 * eosio.rexbal
 * eosio.rexfund
 */
start();
