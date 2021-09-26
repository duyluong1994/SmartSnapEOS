import fs from "fs";
// @ts-ignore
import CsvReadableStream from "csv-reader";
import { createObjectCsvWriter } from "csv-writer";
import { JsonRpc, RpcError } from "eosjs";

// import { settings } from "../src/config";
let settings = {
  LOW_BLOCK: 61132662,
  HIGH_BLOCK: 123670027,
  lastAccounts: "eidosgotoken",
  version: 1,
};

import BigNumber from "bignumber.js";
import { decomposeAsset, AssetSymbol, formatAsset } from "../../src/asset";
const pMap = require("p-map");
const fetch = require("node-fetch");
const rpc = new JsonRpc("https://eos.greymass.com", { fetch });

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
      .on("end", () => resolve({}));
  });

const csvWriter = createObjectCsvWriter({
  path: `snapshots/EOS_PUML_v${settings.version}.csv`,
  header: [`account`, `balance`, `actions`].map((header) => ({
    id: header,
    title: header,
  })),
  append: false,
});

async function start() {
  try {
    console.log(`Starting`);
    await aggregateActionsEOS();

    console.log(`Add number action for EOS Account`, accountEOSMap.size);
  } catch (err:any) {
    console.error(err.stack);
    process.exit(1);
  }

  let records = Array.from(accountEOSMap.values()).sort((a: any, b: any) => {
    return a.totalEOS - b.totalEOS;
  });
  console.log(`Sorted`);
  //start From last account
  if (settings.lastAccounts.length > 0) {
    records = records.splice(
      records.findIndex((item: any) => {
        return item.name === settings.lastAccounts;
      })
    );
  }

  try {
    const batches = [];
    const getBatch = (size: any) => {
      return records.splice(0, size);
    };

    while (records.length > 0) {
      batches.push(getBatch(10));
    }
    await pMap(
      batches,
      (batch: any, index: any) => {
        if (index % 5 === 0) {
          console.log("ETA:", index, batches.length - index, " 🤙");
        }
        return dropBatch(batch);
      },
      { concurrency: 5 }
    );
  } catch (error:any) {
    console.log(error.message);
    process.exit(1);
  }
}

const dropBatch = async (batch: any, tries = 0): Promise<any> => {
  if (tries > 3) {
    process.exit(1);
    return false;
  }

  if (!batch.length) {
    console.log("no batch");
    return false;
  }
  let runningAccount: FilterAccount = {
    name: "",
    totalEOS: new BigNumber(0),
    totalActions: 0,
  };

  try {
    for (let item of batch) {
      runningAccount = item;
      let data: any;
      await rpc.history_get_actions(item.name, -1, -1).then((res) => {
        data = res;
      });
      if (data) {
        if (data.actions) {
          if (data.actions.length > 0) {
            item.totalActions = data.actions[0].account_action_seq;
            csvWriter.writeRecords([
              {
                account: item.name,
                balance: item.totalEOS,
                actions: item.totalActions,
              },
            ]);
          }
        }
      }
    }
  } catch (err:any) {
    //ignore avoid spam accounts
    console.error(`Error at: ${runningAccount.name} 👎`);
    console.log(err.message);
    if (
      err.json &&
      err.json.error &&
      err.json.error.includes("non-existant account")
    ) {
      batch = batch.filter((item: any) => item.name !== runningAccount.name);
      return await dropBatch(batch);
    } else {
      batch = batch.splice(
        batch.findIndex((item: any) => {
          return item.name === runningAccount.name;
        })
      );
      return await dropBatch(batch, tries + 1);
    }
  }
  return true;
};

start();
