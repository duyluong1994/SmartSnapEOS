#! /usr/bin/env node
import program from "commander";
import * as write from "write-json-file";
import { snapshot } from "../src/snapshot"
import { eosdac } from "../src/eosdac"
import { settings, spinner, config, stats } from "../src/config"
import { getInfo } from "../src/eos";
import { csv } from "../src/csv";
import * as pkg from "../package.json"

const {version, description} = pkg;

const list = (value: string) => value.split(",")

program
  .version(version)
  .description(description)
  .option('-c, --code <string>', 'token code')
  .option('-b, --block_num [number]', 'block number')
  .option('-m, --min_balance [number]', 'mininum token balance')
  .option('-o, --out [string]', 'filepath to save csv/json')
  .option('-e, --exclude_accounts [string]', 'exclude accounts', list, "")
  .option('-u, --url [string]', 'http/https URL where nodeos is running')
  .option('--dfuse_api_key [string]', 'dfuse.io API key')
  .option('--eosdac [false]', 'use eosDAC active members')
  .option('--json [false]', 'save as JSON file')
  .option('--headers [false]', 'allow csv headers')

program.on('--help', () => {
  console.log('')
  console.log('Examples:');
  console.log('  $ easysnap --code "eosio.token"');
});

program.parse(process.argv);

async function cli() {
    // Configure
    config({
      TOKEN_CODE: program.code,
      BLOCK_NUMBER: program.block_num,
      EOSIO_ENDPOINT: program.url,
      DFUSE_API_KEY: program.dfuse_api_key,
      MIN_BALANCE: program.min_balance,
      EXCLUDE_ACCOUNTS: program.exclude_accounts,
      HEADERS: program.headers,
      JSON: program.json,
      EOSDAC: program.eosdac,
    })

    // Error handling
    if (!settings.TOKEN_CODE) throw new Error("--code is required");
    if (!settings.DFUSE_API_KEY) throw new Error("--dfuse_api_key is required");

    // CLI params
    const code = settings.TOKEN_CODE;
    const block_num = settings.BLOCK_NUMBER || (await getInfo()).data.last_irreversible_block_num;
    const min_balance = settings.MIN_BALANCE;
    const exclude_accounts = settings.EXCLUDE_ACCOUNTS;
    const headers = settings.HEADERS;
    const json = settings.JSON;
    const dac = settings.EOSDAC;

    // Dynamic filepath name
    const filepath = program.out || `snapshot-${code}-${dac ? "members" : "accounts"}-${Date.now()}-${block_num}.${json ? "json" : "csv"}`;

    // Download Snapshot
    spinner.start(`downloading [${code}] token snapshot`);
    const accounts = dac ? await eosdac(code, block_num, min_balance, exclude_accounts)
      : await snapshot(code, block_num, min_balance, exclude_accounts);

    // Save Snapshot
    if (json) write.sync(filepath, accounts)
    else csv(filepath, accounts, headers)
    spinner.stop()

    // Print Statistics
    console.log(`${filepath}`)
    for (const key of Object.keys(stats)) {
      console.log(`${key}: ${stats[key]}`)
    }
}
cli()
