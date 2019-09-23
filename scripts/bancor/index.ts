import benchmark from "./snapshot_78622974_benchmark.json"
import { getTablesByScopes, getTableScopes } from "../../src/dfuse.js"
import { AssetSymbol, decomposeAsset, formatAsset } from "../../src/asset.js"
import { STAT_ROW, ACCOUNTS_ROW, TConverter, TSnapshot } from "./typings.js"
import * as fs from "fs"
import BigNumber from "bignumber.js"

// console.log(benchmark.converters.reduce((acc, c) => Object.assign(acc, {
//   [c.acct_name]: c.token
// }), {}))
console.log(benchmark.accts.length, benchmark.converters.length)
const BLOCK_NUMBER = 78622974 // 78617810
const MAX_SCOPES_TO_PROCESS = 100
let BANCOR_SYMBOL: AssetSymbol = {
  symbolCode: `BNT`,
  precision: 10,
}

const bancorToken = `bntbntbntbnt`

const converterTokenMap = {
  bancorc11111: 'bancorr11111',
  bancorc11112: 'bancorr11112',
  bancorc11113: 'bancorr11113',
  bancorc11114: 'bancorr11114',
  bancorc11121: 'bancorr11121',
  bancorc11122: 'bancorr11122',
  bancorc11123: 'bancorr11123',
  bancorc11124: 'bancorr11124',
  bancorc11125: 'bancorr11125',
  bancorc11131: 'bancorr11131',
  bancorc11132: 'bancorr11132',
  bancorc11133: 'bancorr11133',
  bancorc11134: 'bancorr11134',
  bancorc11142: 'bancorr11142',
  bancorc11144: 'bancorr11144',
  bancorc11145: 'bancorr11145',
  bancorc11151: 'bancorr11151',
  bancorc11152: 'bancorr11152',
  bancorc11153: 'bancorr11153',
  bancorc11154: 'bancorr11154',
  bancorc11155: 'bancorr11155',
  bancorc11211: 'bancorr11211',
  bancorc11212: 'bancorr11212',
  bancorc11213: 'bancorr11213',
  bancorc11214: 'bancorr11214',
  bancorc11215: 'bancorr11215',
  bancorc11223: 'bancorr11223',
  bnt2eoscnvrt: 'bnt2eosrelay',
  creatorcnvrt: 'creatortokns'
} as {
  [key: string]: string
}

async function getBancorStats() {
  const tableResults = await getTablesByScopes<STAT_ROW>(bancorToken, `stat`, [BANCOR_SYMBOL.symbolCode], BLOCK_NUMBER)

  const supply = tableResults.tables[0].rows[0].json.supply
  const { amount, symbol } = decomposeAsset(supply)
  BANCOR_SYMBOL = symbol

  return {
    totalBntSupplyAmount: amount,
  }
}

async function getBancorBalances(totalBntSupplyAmount: BigNumber) {
  const accountsScopes = (await getTableScopes(bancorToken, `accounts`, BLOCK_NUMBER)).scopes

  const accts = []

  let currentScopes = accountsScopes.splice(0, MAX_SCOPES_TO_PROCESS);
  while (currentScopes.length > 0) {
    const accountTables = await getTablesByScopes<ACCOUNTS_ROW>(bancorToken, `accounts`, currentScopes, BLOCK_NUMBER)
    accts.push(...accountTables.tables.map(table => {
      const { amount } = decomposeAsset(table.rows[0].json.balance)

      if (amount.isZero()) return null

      const balance = formatAsset({ amount, symbol: BANCOR_SYMBOL }, { withSymbol: false })
      return {
        acct_name: table.scope,
        bnt_balance: balance,
        // share_of_bnt: amount.div(totalBntSupplyAmount).toNumber().toFixed(8),
        drop_hodl: balance,
      }
    }))

    currentScopes = accountsScopes.splice(0, MAX_SCOPES_TO_PROCESS);
  }

  // filter out all 0 balances
  const converterAddresses = Object.keys(converterTokenMap)
  return accts.filter(Boolean).filter(acc => !converterAddresses.includes(acc!.acct_name))
}

async function getConverterBalances(totalBntSupplyAmount: BigNumber) {
  let converters: TConverter[] = Object.keys(converterTokenMap).map(converter => {
    return {
      acct_name: converter,
      bnt_balance: ``,
      share_of_bnt: ``,
      accts: [],
      token: converterTokenMap[converter],
      tokenSymbol: ``
    }
  })

  const bancorAccountsTables = await getTablesByScopes<ACCOUNTS_ROW>(bancorToken, `accounts`, converters.map(c => c.acct_name), BLOCK_NUMBER)
  bancorAccountsTables.tables.forEach(table => {
    const converter = converters.find(c => c.acct_name === table.scope)
    if (!converter || table.rows.length === 0) {
      console.log(`No balance row found for converter ${table.scope}`)
      return
    }

    const { amount } = decomposeAsset(table.rows[0].json.balance)
    converter.bnt_balance = formatAsset({ amount, symbol: BANCOR_SYMBOL }, { withSymbol: false });
    converter.share_of_bnt = amount.div(totalBntSupplyAmount).toNumber().toFixed(8)
  })

  for (const converter of converters) {
    const symbolScopes = (await getTableScopes(converter.token, `stat`, BLOCK_NUMBER)).scopes
    if (symbolScopes.length !== 1) {
      console.log(`Converter has no or more than one symbol defined: ${converter.acct_name}: ${symbolScopes.join(` `)}`)
      continue;
    }
    const statResult = await getTablesByScopes<STAT_ROW>(converter.token, `stat`, [symbolScopes[0]], BLOCK_NUMBER)

    const { symbol } = decomposeAsset(statResult.tables[0].rows[0].json.max_supply)
    converter.tokenSymbol = `${symbol.symbolCode},${symbol.precision}`

    // now get all accounts and balances for converter token
    const accountsScopes = (await getTableScopes(converter.token, `accounts`, BLOCK_NUMBER)).scopes
    const converterAccountsTables = await getTablesByScopes<ACCOUNTS_ROW>(converter.token, `accounts`, accountsScopes, BLOCK_NUMBER)
    let totalConverterTokens = new BigNumber(0)
    const accts = converterAccountsTables.tables.map(table => {
      const { amount } = decomposeAsset(table.rows[0].json.balance)

      if (amount.isZero()) return null
      totalConverterTokens = totalConverterTokens.plus(amount)

      return {
        acct_name: table.scope,
        relay_token_balance: amount as any,
        share_of_relays_bnt: `0`,
        drop_hodl: `0`
      }
    }).filter(Boolean) as TConverter["accts"]

    accts.forEach(acct => {
      const share = (acct.relay_token_balance as unknown as BigNumber).div(totalConverterTokens)
      acct.share_of_relays_bnt = share.toNumber().toFixed(8)
      acct.relay_token_balance = formatAsset({ amount: acct.relay_token_balance as any, symbol: BANCOR_SYMBOL }, { withSymbol: false })
      acct.drop_hodl = share.times(converter.bnt_balance).toFixed(BANCOR_SYMBOL.precision, BigNumber.ROUND_DOWN)
    })

    converter.accts = accts
  }

  return converters
}

async function addConverterAccountBalances(snapshot: TSnapshot) {
  for (const converter of snapshot.converters) {
    for (const acct of converter.accts) {
      const foundAcct = snapshot.accts.find(a => a.acct_name === acct.acct_name)
      if (foundAcct) {
        foundAcct.drop_hodl = new BigNumber(foundAcct.drop_hodl).plus(new BigNumber(acct.drop_hodl)).toFixed(BANCOR_SYMBOL.precision, BigNumber.ROUND_DOWN)
      } else {
        snapshot.accts.push({
          acct_name: acct.acct_name,
          bnt_balance: `0`,
          drop_hodl: acct.drop_hodl
        })
      }
    }
  }
}

async function getSnapshot() {
  const { totalBntSupplyAmount } = await getBancorStats()
  let snapshot: any = {
    total_bnt_supply: formatAsset({ amount: totalBntSupplyAmount, symbol: BANCOR_SYMBOL }, { withSymbol: false }),
  }

  snapshot = {
    accts: await getBancorBalances(totalBntSupplyAmount),
    ...snapshot,
  }

  snapshot = {
    converters: await getConverterBalances(totalBntSupplyAmount),
    ...snapshot,
  }

  snapshot = {
    ...snapshot,
    num_bnt_accts: snapshot.accts.length,
  }

  await addConverterAccountBalances(snapshot)


  return snapshot
}

async function createSnapshot() {
  const snapshot = await getSnapshot()

  const snapshotJSON = JSON.stringify(snapshot, null, 4)
  fs.writeFileSync(__dirname + `/snapshot_${BLOCK_NUMBER}.json`, snapshotJSON)
}

createSnapshot().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
