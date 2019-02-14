#! /usr/bin/env node
import program from "commander";
import { snapshot } from "../src/snapshot"
import { settings, spinner } from "../src/config"

const pkg = require("../package.json");
const {version, description} = pkg;

program
  .version(version)
  .description(description)
  .option('-c, --contract', 'token contract')
  .option('-b, --block_num', 'block number')
  .option('-u, --url', 'http/https URL where nodeos is running')

program.on('--help', () => {
  console.log('')
  console.log('Examples:');
  console.log('  $ easysnap --contract <TOKEN CONTRACT> --block_num <BLOCK NUMBER>');
});

program.parse(process.argv);

if (program.contract) settings.TOKEN_CONTRACT = program.contract;
if (program.block_num) settings.BLOCK_NUMBER = program.block_num;
if (program.url) settings.EOSIO_ENDPOINT = program.url;

async function cli() {
    if (!settings.TOKEN_CONTRACT) throw new Error("--contract is required");
    if (!settings.BLOCK_NUMBER) throw new Error("--block_num is required");

    spinner.start(`downloading [${settings.TOKEN_CONTRACT}] token snapshot`);
    const accounts = await snapshot(settings.TOKEN_CONTRACT, settings.BLOCK_NUMBER);

    for (const account of accounts) {
        console.log(account)
    }
    spinner.stop()
}
cli()
