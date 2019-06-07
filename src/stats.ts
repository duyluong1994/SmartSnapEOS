import { TableScopeResult } from "./dfuse";
import { logger } from "./logger";
import { Abi } from "@dfuse/client";
import { any } from "prop-types";
import flatten from "lodash/flatten";
import isEmpty from "lodash/isEmpty";
import { ExtendedRow } from "./snapshot";

type AbiStruct = {
  name: string;
  base: string;
  fields: {
    name: string;
    type: string;
  }[];
};

class StatsAggregator {
  abi: Abi;
  tableStruct: AbiStruct;

  constructor(abi: Abi, tableName: string) {
    this.abi = abi;
    const tableDef = this.abi.tables.find(table => table.name === tableName);
    if (!tableDef) throw new Error(`Cannot find table "${tableName}" in ABI.`);

    const tableStruct = this.getStruct(tableDef.type);
    if (!tableStruct)
      throw new Error(`Cannot find struct "${tableDef.type}" in ABI.`);

    this.tableStruct = tableStruct;
  }

  isPrimitiveType(type: string): boolean {
    switch (type) {
      case "bool":
      case "asset":
      case "name":
      case "symbol":
      case "string": {
        return true;
      }
      // TODO: add all primitive types
      default:
        return false;
    }
  }

  getInitialValueForType(fieldName: string, fieldType: string) {
    if (this.isPrimitiveType(fieldType)) {
      switch (fieldType) {
        case "bool":
          return 0;
        case "asset":
          return `0.0000 DUMMY`;
        case "name":
        case "symbol":
        case "string": {
        }
        default:
          return 0;
      }
    }
    const rowValueStructName = this.getStruct(fieldName);
    if (!rowValueStructName) return `NA`;

    // TODO: implement recursive aggregation
    return `NA`;
  }

  reducers(typeName: string) {
    const noop = () => `NA`;
    switch (typeName) {
      case "bool": {
        return (acc: number, val: string) => acc + (val ? 1 : 0);
      }
      case "asset":
      case "name":
      case "symbol":
      case "string":
      default:
        return noop;
    }
  }

  getStruct(structName: string) {
    const struct = this.abi.structs.find(s => s.name === structName);

    return struct;
  }

  getTypeForName = (struct: AbiStruct, fieldName: string) => {
    const field = struct.fields.find(f => f.name === fieldName);

    if (!field)
      throw new Error(
        `Cannot find field "${fieldName}" in struct "${struct.name}"`
      );
    return field.type;
  };

  getInitialStats = () => {
    const initialStats: ExtendedRow = {
      scope: `NA`
    };
    this.tableStruct.fields.forEach(field => {
      initialStats[field.name] = this.getInitialValueForType(
        field.name,
        field.type
      );
    });

    return initialStats;
  };

  process(oldStats: any, rows: ExtendedRow[]) {
    if (rows.length === 0) return oldStats;

    Object.keys(rows[0]).forEach(rowKey => {
      const rowsValuesForKey = rows.map(r => r[rowKey]);
      oldStats[rowKey] = this.aggregate(
        rowsValuesForKey,
        rowKey,
        this.getTypeForName(this.tableStruct, rowKey),
        oldStats[rowKey]
      );
    });

    return oldStats;
  }

  aggregate(
    values: any[],
    fieldName: string,
    fieldType: string,
    accValue: any
  ) {
    if (this.isPrimitiveType(fieldType)) {
      return values.reduce(this.reducers(fieldType), accValue);
    }
    const rowValueStructName = this.getStruct(fieldName);
    if (!rowValueStructName) return `NA`;

    // TODO: implement recursive aggregation
    return `NA`;
  }
}

export type Stats = {
  scopesTotal: number;
  scopesProcessed: number;
  lastScopeProcessed: string;
  rowsProcessed: number;
  runStart: Date;
  runScopesProcessed: number;
  runEta?: Date;
  rowStats: any;
};

type SetScopesAction = {
  type: "SET_SCOPES";
  payload: {
    scopesTotal: number;
    scopesProcessed: number;
    lastScopeProcessed: string;
    rowStats: any;
  };
};

type ProcessRowsAction = {
  type: "PROCESS_ROWS";
  payload: {
    tables: TableScopeResult<any>[];
  };
};

type ActionTypes = SetScopesAction | ProcessRowsAction;

export const initialStats: Stats = {
  scopesTotal: 0,
  scopesProcessed: 0,
  lastScopeProcessed: "",
  rowsProcessed: 0,
  runStart: new Date(),
  runScopesProcessed: 0,
  runEta: undefined,
  rowStats: any
};

const calculateEta = (start: Date, processed: number, left: number) => {
  const msPerScope = (Date.now() - start.getTime()) / processed;
  logger.info(`${processed}, ${left}`);
  return new Date(Date.now() + left * msPerScope);
};

const reducer = (state: Stats = initialStats, action: ActionTypes) => {
  switch (action.type) {
    case "SET_SCOPES":
      return {
        ...state,
        scopesTotal: action.payload.scopesTotal,
        scopesProcessed: action.payload.scopesProcessed,
        runStart: new Date(),
        rowStats: isEmpty(action.payload.rowStats)
          ? statsAggregator.getInitialStats()
          : action.payload.rowStats
      };
    case "PROCESS_ROWS": {
      const { tables } = action.payload;
      const scopesProcessed = (state.scopesProcessed += tables.length);
      const rowsProcessed = (state.rowsProcessed += tables.reduce(
        (acc, t) => acc + t.rows.length,
        0
      ));
      const runScopesProcessed = state.runScopesProcessed + tables.length;

      return {
        ...state,
        scopesProcessed,
        rowsProcessed,
        runScopesProcessed,
        lastScopeProcessed:
          tables.length > 0
            ? tables.slice(-1)[0].scope
            : state.lastScopeProcessed,
        runEta: calculateEta(
          state.runStart,
          runScopesProcessed,
          state.scopesTotal - state.scopesProcessed
        ),
        rowStats: statsAggregator.process(
          state.rowStats,
          flatten(tables.map(t => t.rows.map(row => row.json)))
        )
      };
    }
    default:
      return state;
  }
};

let state: Stats;
let dispatch: (action: ActionTypes) => void;
let statsAggregator: StatsAggregator;

const store = {
  setAbi: (abi: Abi, tableName: string) => {
    statsAggregator = new StatsAggregator(abi, tableName);
  },
  setFromReact: (s: Stats, d: (action: ActionTypes) => void) => {
    state = s;
    dispatch = d;
  },
  getState: () => state,
  dispatch: (action: ActionTypes) => dispatch(action)
};

export { reducer, store };
