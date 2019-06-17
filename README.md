# `smartsnap`

> EOS table snapshot tool

This tool uses [dfuse.io](https://dfuse.io) to create snapshots of any contract account table at any block number.

## How to use

Configure the `.env` file to include `CODE`, `TABLE` and `BLOCK_NUMBER`.

After compiling with `typescript` (running `tsc`):

```bash
npm i
tsc

npm start
```

## Resources

Based on [easysnap-v2](https://github.com/airdropsdac/easysnap-v2)
