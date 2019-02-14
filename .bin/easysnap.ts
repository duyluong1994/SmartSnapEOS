#! /usr/bin/env node
import program from "commander";
import * as write from "write-json-file";
import { snapshot } from "../src/snapshot"
import { settings, spinner, config } from "../src/config"
import { getInfo } from "../src/eos";
import { csv } from "../src/csv";
const pkg = require("../package.json");
const {version, description} = pkg;

program
  .version(version)
  .description(description)
  .option('-c, --code <string>', 'token code')
  .option('-b, --block_num [number]', 'block number')
  .option('-o, --out [string]', 'filepath to save csv/json')
  .option('-u, --url [string]', 'http/https URL where nodeos is running')
  .option('--dfuse_api_key [string]', 'dfuse.io API key')
  .option('--headers [false]', 'allow csv headers')
  .option('--json [false]', 'save as JSON file')

program.on('--help', () => {
  console.log('')
  console.log('Examples:');
  console.log('  $ easysnap -o "snapshot.csv" --code <TOKEN_CODE> --block_num <BLOCK_NUMBER>');
});

program.parse(process.argv);

async function cli() {
    // Configure
    config({
      TOKEN_CODE: program.code,
      BLOCK_NUMBER: program.block_num,
      EOSIO_ENDPOINT: program.url,
      DFUSE_API_KEY: program.dfuse_api_key
    })

    // Error handling
    if (!settings.TOKEN_CODE) throw new Error("--code is required");
    if (!settings.DFUSE_API_KEY) throw new Error("--dfuse_api_key is required");

    const code = settings.TOKEN_CODE;
    const table = settings.TOKEN_TABLE;
    const block_num = settings.BLOCK_NUMBER || (await getInfo()).data.last_irreversible_block_num;

    // CLI params
    const headers = program.headers;
    const json = program.json;
    const filepath = program.out || `snapshot-${code}-${table}-${Date.now()}-${block_num}.csv`;

    spinner.start(`downloading [${code}] token snapshot`);
    const accounts = await snapshot(code, block_num);
    if (json) write.sync(filepath, accounts)
    else csv(filepath, accounts, headers)
    spinner.stop()
}
cli()
