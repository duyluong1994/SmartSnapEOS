# `easysnap`

> EOS token snapshot tool

## Install

```
$ sudo npm install -g easysnap
```

## How to use

```bash
$ easysnap --code "eosio.token"
```

## Javascript

```js
import { snapshot } from "easysnap"

snapshot("eosio.token", 43000000).then(accounts => {
    for (const account of accounts) {
        console.log(account)
    }
})
```

## Configure

Define your environment variables or create a `.env` file

**.env**

```env
DFUSE_API_KEY="<API KEY>"
EOSIO_ENDPOINT="https://eos.greymass.com"
DFUSE_ENDPOINT="https://mainnet.eos.dfuse.io"
TOKEN_CODE="eosio.token"
TOKEN_TABLE="accounts"
BLOCK_NUMBER=42300000
```

## CLI

```bash
$ easysnap --help

Usage: easysnap.ts [options]

EOS token snapshot tool

Options:
  -V, --version                    output the version number
  -c, --code <string>              token code
  -b, --block_num [number]         block number
  -m, --min_balance [number]       mininum token balance (default: 0)
  -o, --out [string]               filepath to save csv/json
  -e, --exclude_accounts [string]  exclude accounts (default: "")
  -u, --url [string]               http/https URL where nodeos is running
  --dfuse_api_key [string]         dfuse.io API key
  --balance_integer [false]        token balance as integer (default: false)
  --eosdac [false]                 use eosDAC active members (default: false)
  --json [false]                   save as JSON file (default: false)
  --headers [false]                allow csv headers (default: false)
  -h, --help                       output usage information

Examples:
  $ easysnap --code "eosio.token"
```