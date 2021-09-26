import BigNumber from "bignumber.js"

// mimicks EOS C++ smart contract asset and symbol class
export type AssetSymbol = {
  symbolCode: string;
  precision: number;
};

export type Asset = {
  amount: BigNumber;
  symbol: AssetSymbol;
};

type FormatOptions = {
  withSymbol?: boolean;
  separateThousands?: boolean;
};

/**
 * Example:
 * { amount: 1230000, symbol: { symbolCode: 'DAPP', precision: 4 }} => '123.0000 DAPP'
 */
export function formatAsset({ amount, symbol }: Asset, formatOptions?: FormatOptions): string {
  const options: FormatOptions = Object.assign(
    {
      withSymbol: true,
      separateThousands: false,
    },
    formatOptions || {},
  );
  const { precision, symbolCode } = symbol;
  let s = String(amount);
  while (s.length < precision + 1) {
    s = `0${s}`;
  }

  let pre = s.slice(0, -precision);
  const decimals = s.slice(-precision);

  if (options.separateThousands) {
    // adds `,` thousand separators
    // https://stackoverflow.com/a/2901298/9843487
    pre = pre.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  let result = `${pre}.${decimals}`;
  if (options.withSymbol) result = `${result} ${symbolCode}`;
  return result;
}

/**
 * Example
 * '123.0000 DAPP' => { amount: 1230000, symbol: { symbolCode: 'DAPP', precision: 4 }}
 */
export function decomposeAsset(assetString: string): Asset {
  try {
    const [amountWithPrecision, symbolName] = assetString.split(` `);
    if (!amountWithPrecision || !symbolName) {
      throw new Error(`Invalid split`);
    }
    const amountNoPrecision = new BigNumber(amountWithPrecision.replace(`.`, ``));

    const dotIndex = amountWithPrecision.indexOf(`.`);
    if (dotIndex === -1) {
      throw new Error(`No dot found`);
    }
    const precision = amountWithPrecision.length - dotIndex - 1;

    return {
      amount: amountNoPrecision,
      symbol: {
        precision,
        symbolCode: symbolName,
      },
    };
  } catch (error:any) {
    throw new Error(
      `Invalid asset passed to decomposeAsset: ${JSON.stringify(assetString)}. ${error.message}`,
    );
  }
}
