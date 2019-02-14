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
  .option('-c, --code', 'token code')
  .option('-b, --block_num', 'block number')
  .option('-o, --out', 'filepath to save csv/json')
  .option('-u, --url', 'http/https URL where nodeos is running')
  .option('--dfuse_api_key', 'dfuse.io API key')
  .option('--headers [false]', 'allow csv headers')
  .option('--json [false]', 'save as JSON file')

program.on('--help', () => {
  console.log('')
  console.log('Examples:');
  console.log('  $ easysnap -o "snapshot.csv" --code <TOKEN_CODE> --block_num <BLOCK_NUMBER>');
});

program.parse(process.argv);

async function cli() {
    if (program.code) settings.TOKEN_CODE = program.code;
    if (program.block_num) settings.BLOCK_NUMBER = program.block_num;
    if (program.url) settings.EOSIO_ENDPOINT = program.url;

    // Error handling
    config()
    if (!settings.TOKEN_CODE) throw new Error("--code is required");

    const code = settings.TOKEN_CODE;
    const table = settings.TOKEN_TABLE;
    const block_num = settings.BLOCK_NUMBER || (await getInfo()).data.last_irreversible_block_num;

    // CLI params
    const headers = program.headers;
    const json = program.json;
    const filepath = program.out || `snapshot-${code}-${table}-${Date.now()}.csv`;

    spinner.start(`downloading [${code}] token snapshot`);
    const accounts = await snapshot(code, block_num);
    if (json) write.sync(filepath, accounts)
    else csv(filepath, accounts, headers)
    spinner.stop()
}
cli()
