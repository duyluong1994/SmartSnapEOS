import { createDfuseClient, OnDiskApiTokenStore } from '@dfuse/client';
import fetch from 'node-fetch';
import { settings } from "./config";
import { logger } from "./logger"

export interface SingleTableScopeResult<T> {
  last_irreversible_block_id: string;
  last_irreversible_block_num: number;
  rows: TableScopeRowResult<T>[];
}

export interface TableScopesResult<T> {
  last_irreversible_block_id: string;
  last_irreversible_block_num: number;
  tables: TableScopeResult<T>[];
}

export interface TableScopeResult<T> {
  account: string;
  scope: string;
  rows: TableScopeRowResult<T>[];
}

export interface TableScopeRowResult<T> {
  key: string;
  payer: string;
  json: T;
}

export interface TableScopes {
  block_num: number;
  scopes: string[];
}

const client = createDfuseClient({
    apiKey: settings.DFUSE_API_KEY,
    network: `mainnet`,
    httpClientOptions: {
        fetch,
    },
    streamClientOptions: {
        socketOptions: {
            webSocketFactory: async () => null,
        },
    } as any,
    apiTokenStore: new OnDiskApiTokenStore(settings.DFUSE_API_KEY),
})

export async function getTableScopes(
  code: string,
  table: string,
  block_num: number
) {
  logger.debug(`getTableScopes ${JSON.stringify({ code, table, block_num })}`);
  try {
    const response = await client.stateTableScopes(code, table, { blockNum: block_num })
    return response as unknown as TableScopes;
  } catch (e) {
    throw e;
  }
}

// export async function getTableRowsByScope<T>(
//   code: string,
//   table: string,
//   scope: string,
//   block_num: number
// ): Promise<SingleTableScopeResult<T>> {
//   log(
//     `getTableRowsByScope    ${JSON.stringify({
//       code,
//       scope,
//       table,
//       block_num
//     })}`
//   );
//   const params = {
//     account: code,
//     table,
//     scope,
//     block_num
//   };
//   try {
//     const response = await axios.get<SingleTableScopeResult<T>>(
//       `${settings.DFUSE_ENDPOINT}/v0/state/table`,
//       { params }
//     );
//     return response.data;
//   } catch (e) {
//     throw e;
//   }
// }

export async function getTablesByScopes<T>(
  code: string,
  table: string,
  scopes: string[],
  block_num: number
) : Promise<TableScopesResult<T>> {
  logger.debug(
    `getTablesByScopes    ${JSON.stringify({
      code,
      scopes: scopes.length,
      table,
      block_num
    })}`
  );
  try {
    const response = await client.stateTablesForScopes<T>(code, scopes, table, { blockNum: block_num})
    return response as unknown as TableScopesResult<T>;
  } catch (e) {
    throw e;
  }
}
