
21806.343160681 / 8212208.172697674
bnt_balance / total_bnt_supply = share_of_bnt

relay_token_balance / bnt_balance = share_of_relays_bnt
31254 / 21806.343160681 = 1.43325269

converter_account = bancorc11144 // holds BNT
converter_token_account = bancorr11142 // manages token 


# Look out for
Account `guztoojqgege` has converter tokens and BNT itself

# Total drop?

```js
1120351.7666152033 / 0.002639440530967412 = 424465621.964428
1264.2103758363 / 0.00015307386992033666 = 8258825.47095873
660.9693621944 / 0.00008003188401530306 = 8258825.47095873 = total bnt supply
21798.6786862345 / 0.002639440530967412 = 8258825.47095873
total * share = balance
total = balance / share


total_drop * share_of_bnt = to_drop
total_drop = to_drop / share_of_bnt
WTF total drop is always different

// accts
0.0890908985 / 0.00010386220180271275 = 857.779798172
0.1935175746 / 0.00015307386992033666 = 1264.210375688
0.0528986233 / 0.00008003188401530306 = 660.969361784 

// converters
57.5363160460 / 0.002639440530967412 = 21798.678686241 = bnt_balance, wtf?
```

# Allocation

· An address which holds BNT tokens should receive the exact same amount that it holds.
· An address which holds other tokens should receive the amount that it holds multiplied by N and
divided by D, where:
* N is the total amount of BNT held by the Bancor Converter contract.
* D is the total supply of BNT in the BNT Token contract.

```js
N = converter.bnt_balance
D = ? // D is the total supply of _OTHER TOKEN_ in the BNT Token contract?
// account.to_drop = converter.accts[account].relay_token_balance * converter.bnt_balance / D

// D = converter.accts[account].relay_token_balance * converter.bnt_balance / account.to_drop

account.to_drop = converter.accts[account].share_of_relays_bnt * converter.bnt_balance
```

```js
"converters": [
        {
            "acct_name": "bancorc11111",
            "bnt_balance": "8785.8628282096",
            "share_of_bnt": "0.00103839",
            "accts": [
                {
                    "acct_name": "blackbancorx",
                    "relay_token_balance": "156276.0000000000",
                    "share_of_relays_bnt": "0.99828830"
                },
                {
                    "acct_name": "bnr533142445",
                    "relay_token_balance": "7.5443150518",
                    "share_of_relays_bnt": "0.00004819"
                },
```

Rounding error @g43tqmrzgyge, @bnr224221435!!, @equareserve1, @bancorpeosst