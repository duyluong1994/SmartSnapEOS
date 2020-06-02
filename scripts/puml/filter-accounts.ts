import fs from "fs";
// @ts-ignore
import CsvReadableStream from "csv-reader";
import { createObjectCsvWriter } from "csv-writer";
import { JsonRpc, RpcError } from "eosjs";
// import { settings } from "../src/config";
let settings = {
  LOW_BLOCK: 61132662,
  HIGH_BLOCK: 123670027,
  min_EOS: 20.0,
};

import BigNumber from "bignumber.js";
import { decomposeAsset, AssetSymbol, formatAsset } from "../../src/asset";
const fetch = require("node-fetch");
const rpc = new JsonRpc("https://eos.greymass.com", { fetch });
const EOS_SYMBOL: AssetSymbol = { symbolCode: `EOS`, precision: 4 };

type Account = {
  name: string;
  totalEOS: BigNumber;
  liquidEOS: BigNumber;
  stakedEOS: BigNumber;
  rexEOS: BigNumber;
};

type FilterAccount = {
  name: string;
  totalEOS: BigNumber;
  totalActions: number;
};

const getFileNames = () => {
  return {
    snapshots: `snapshots/EOS_${settings.HIGH_BLOCK}.csv`,
  };
};

if (!settings.HIGH_BLOCK) {
  throw new Error(`No block number specified`);
}

const fileNames = getFileNames();
const accountEOSMap = new Map<string, FilterAccount>();
const getOrCreateAccount = (item: any) => {
  if (!accountEOSMap.has(item.name)) {
    accountEOSMap.set(item.name, {
      name: item.name,
      totalEOS: item.totalEOS,
      totalActions: 0,
    });
  }
  return accountEOSMap.get(item.name)!;
};

const aggregateActionsEOS = async () =>
  new Promise((resolve) => {
    if (!fs.existsSync(fileNames[`snapshots`])) {
      throw new Error(`File "${fileNames[`snapshots`]}" does not exist`);
    }

    let inputStream = fs.createReadStream(fileNames[`snapshots`], "utf8");
    inputStream
      .pipe(
        CsvReadableStream({
          parseNumbers: false,
          parseBooleans: true,
          trim: true,
        })
      )
      .on("data", async (_row: any) => {
        let row: Account;
        if (Array.isArray(_row)) {
          row = {
            name: _row[0],
            totalEOS: _row[1],
            liquidEOS: _row[2],
            stakedEOS: _row[3],
            rexEOS: _row[4],
          };
        } else {
          throw new Error(`Something is wrong with this row: ${_row}`);
        }

        const amount = row.totalEOS;
        const acc = getOrCreateAccount(row);

        acc.totalEOS = amount;
      })
      .on("end", () => resolve());
  });

async function start() {
  try {
    console.log(`Starting`);
    await aggregateActionsEOS();

    console.log(`Add number action for EOS Account`, accountEOSMap.size);
  } catch (err) {
    console.error(err.stack);
  }
  let i = 0;
  for (const [key, value] of accountEOSMap) {
    const data = await rpc
      .history_get_actions(value.name, -1, -1)
      .catch((error) => {
        console.error(error);
        console.log(value.name);
      });

    if (data.actions) {
      if (data.actions.length > 0) {
        value.totalActions = data.actions[0].account_action_seq;
      }
    }
    i++;
    console.log(`${i} / ${accountEOSMap.size}`);
    if (i === 5) {
      break;
    }
  }

  const records = Array.from(accountEOSMap.values()).sort(
    (a, b) => b.totalActions - a.totalActions
  );

  console.log(`Sorted`);

  const outputFile = ``;
  const csvWriter = createObjectCsvWriter({
    path: `snapshots/EOS_${settings.LOW_BLOCK}_${settings.HIGH_BLOCK}.csv`,
    header: [`account`, `balance`, `actions`].map((header) => ({
      id: header,
      title: header,
    })),
    append: false,
  });

  do {
    // need to write in chunks, otherwise out of memory
    let chunk = records.splice(0, 1000);
    await csvWriter.writeRecords(
      chunk.map((val) => ({
        account: val.name,
        balance: formatAsset(
          { amount: val.totalEOS, symbol: EOS_SYMBOL },
          { withSymbol: false }
        ),
        actions: val.totalActions,
      }))
    );
  } while (records.length > 0);
}

start();
