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

Usage: easysnap [options]

EOS token snapshot tool

Options:
  -V, --version             output the version number
  -c, --code <string>       token code
  -b, --block_num [number]  block number
  -o, --out [string]        filepath to save csv/json
  -u, --url [string]        http/https URL where nodeos is running
  --dfuse_api_key [string]  dfuse.io API key
  --headers [false]         allow csv headers
  --json [false]            save as JSON file
  -h, --help                output usage information

Examples:
  $ easysnap --code "eosio.token"
```