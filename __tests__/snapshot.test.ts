import { snapshot } from "../"

snapshot("eosio.token", 43000000).then(accounts => {
    for (const account of accounts) {
        console.log(account)
    }
})