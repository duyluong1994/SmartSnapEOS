#! /usr/bin/env node
import program from "commander";
import { format } from "date-fns";
import * as fs from "fs";
import * as pkg from "../package.json";
import { config, settings } from "../src/config";
import { initCsv } from "../src/csv";
import { initDatabase } from "../src/db";
import { getInfo, getAbi } from "../src/eos";
import { addLogFile, logger } from "../src/logger";
import { snapshot } from "../src/snapshot";
import { store } from "../src/stats";
import { render } from "../src/console";

const { version, description } = pkg;

const list = (value: string) => value.split(",");

program
  .version(version)
  .description(description)
  .option("-c, --code <string>", "contract account")
  .option("-t, --table <string>", "table name")
  .option("-b, --block_num [number]", "block number")
  .option("-m, --min_balance [number]", "mininum token balance", 0)
  .option("-o, --out [string]", "filepath to save csv/json")
  .option("-e, --exclude_accounts [string]", "exclude accounts", list, "")
  .option("-u, --url [string]", "http/https URL where nodeos is running")
  .option("--dfuse_api_key [string]", "dfuse.io API key")
  .option("--balance_integer [boolean]", "token balance as integer", false)
  .option("--json [boolean]", "save as JSON file", false)
  .option("--csv_headers [boolean]", "allow csv headers", false);

program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log('  $ easysnap --code "eosio.token"');
});

program.parse(process.argv);

const directoriesToCreate = ["db", "logs", "snapshots"];

async function cli() {
  // Configure
  config({
    CODE: program.code,
    TABLE: program.table,
    BLOCK_NUMBER: program.block_num,
    EOSIO_ENDPOINT: program.url,
    DFUSE_API_KEY: program.dfuse_api_key,
    CSV_HEADERS: program.csv_headers,
    JSON: program.json,
  });

  // Error handling
  if (!settings.CODE) throw new Error("--code is required");
  if (!settings.TABLE) throw new Error("--table is required");
  if (!settings.DFUSE_API_KEY) throw new Error("--dfuse_api_key is required");

  // CLI params
  const code = settings.CODE;
  const table = settings.TABLE;
  const block_num =
    settings.BLOCK_NUMBER || (await getInfo()).data.last_irreversible_block_num;
  const csv_headers = settings.CSV_HEADERS;
  const json = settings.JSON;

  directoriesToCreate.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  });

  // Dynamic filepath name
  const filepath =
    program.out ||
    `snapshots/${code}-${table}_${format(new Date(), `yyyy-MM-dd_HH:mm:ss`)}.${
      json ? "json" : "csv"
    }`;
  addLogFile(`${code}-${table}-${block_num}`);
  initDatabase(`${code}-${table}-${block_num}`);
  let csvWriter;

  // Print settings
  logger.info(`Settings: ${JSON.stringify(settings, null, 2)}`);

  // start dynamic console
  const { unmount } = render();

  // fetch ABI
  const { abi } = (await getAbi(code)).data;
  store.setAbi(abi, table);
  logger.info(JSON.stringify(abi));

  // Download Snapshot
  for await (const rows of snapshot(code, table, block_num)) {
    if (!csvWriter)
      csvWriter = initCsv(
        `${code}-${table}-${block_num}`,
        Object.keys(rows[0])
      );
    await csvWriter.writeRecords(rows);
  }

  // Print Statistics
  logger.info(
    `Statistics (${filepath}): ${JSON.stringify(store.getState(), null, 2)}`
  );
  unmount();
}
cli();
