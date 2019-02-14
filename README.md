# `easysnap`

> EOS token snapshot tool

## Install

```
$ npm install -g easysnap
```

## How to use

```
$ easysnap --contract <TOKEN CONTRACT> --block_num <BLOCK NUMBER> --dfuse_api_key <DFUSE API KEY>
$ easysnap --contract eosio.token --block_num 42300000 --dfuse_api_key "eyJ...lug"
```

## Configure

Define your environment variables or create a `.env` file

**.env**
```env
DFUSE_API_KEY="<API KEY>"
EOSIO_ENDPOINT="https://eos.greymass.com"
DFUSE_ENDPOINT="https://mainnet.eos.dfuse.io"
TOKEN_CODE="eosio.token"
BLOCK_NUMBER=42300000
```