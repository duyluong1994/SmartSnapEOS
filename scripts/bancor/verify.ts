import * as fs from "fs"
import BigNumber from "bignumber.js"
import benchmark from "./snapshot_82585562_benchmark.json"
import snapshot from "./snapshot_82585562.json"
import { getTablesByScopes, getTableScopes } from "../../src/dfuse.js"
import { AssetSymbol, decomposeAsset, formatAsset } from "../../src/asset.js"
import { STAT_ROW, ACCOUNTS_ROW, TConverter, TSnapshot, TCreatorConverter, RESERVES_ROW } from "./typings.js"


async function compareSnapshot() {
  const snapshotAccounts = snapshot.accts.map(acc => acc.acct_name)
  const benchmarkAccounts = benchmark.accts.map(acc => acc.acct_name)

  const accountsOnlyInSnapshot = snapshotAccounts.filter(accName => !benchmarkAccounts.includes(accName))
  const accountsOnlyInBenchmark = benchmarkAccounts.filter(accName => !snapshotAccounts.includes(accName))
  if(accountsOnlyInBenchmark.length > 0 || accountsOnlyInSnapshot.length > 0) {
    console.error(`Found accounts that are only in one snapshot`)
    console.error(`only in Snapshot`, accountsOnlyInSnapshot)
    console.error(`only in Benchmark`, accountsOnlyInBenchmark)
    return;
  }

  snapshot.accts.forEach(acct => {
    const benchmarkAcct = benchmark.accts.find(a => a.acct_name === acct.acct_name)!
    if(acct.drop_hodl === benchmarkAcct.drop_hodl) {
      const diff = new BigNumber(acct.drop_hodl).minus(new BigNumber(benchmarkAcct.drop_hodl))
      console.log(`Diff for account ${acct.acct_name}: Diff ${diff} | Snapshot ${acct.drop_hodl} | Benchmark ${benchmarkAcct.drop_hodl}.`)
    }
  });
}

compareSnapshot().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
