export type STAT_ROW = {
  issuer: string;
  max_supply: string;
  supply: string;
};

export type ACCOUNTS_ROW = {
  balance: string;
};

export type RESERVES_ROW = {
  balance: string;
  p_enabled: boolean;
  ratio: number;
  currency: string;
  contract: string;
};

export type TSnapshot = {
  creatorcnvrt: TCreatorConverter;
  converters: TConverter[];
  accts: [
    {
      acct_name: string;
      bnt_balance: string;
      // share_of_bnt: string;
      drop_hodl: string;
    }
  ];
};

export type TConverter = {
  acct_name: string;
  bnt_balance: string;
  share_of_bnt: string;
  accts: {
    acct_name: string;
    relay_token_balance: string;
    share_of_relays_bnt: string;
    drop_hodl: string;
  }[];
  token: string;
  tokenSymbol: string;
};

export type TCreatorConverter = {
  bnt_balance: string;
  share_of_bnt: string;
  token: string;
  tokens: {
    smart_supply: string;
    tokenSymbol: string;
    bnt_supply: string;
    accts: {
      acct_name: string;
      relay_token_balance: string;
      share_of_relays_bnt: string;
      drop_hodl: string;
    }[];
  }[];
};
