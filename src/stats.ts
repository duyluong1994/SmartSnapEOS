import { TableScopeResult } from "./dfuse";
import { logger } from "./logger";
import { Abi } from "@dfuse/client";

export type Stats = {
  scopesTotal: number;
  scopesProcessed: number;
  lastScopeProcessed: string;
  rowsProcessed: number;
  runStart: Date;
  runScopesProcessed: number;
  runEta?: Date;
};

type SetScopesAction = {
  type: "SET_SCOPES";
  payload: {
    scopesTotal: number
    scopesProcessed: number
    lastScopeProcessed: string
  };
};

type ProcessRowsAction = {
  type: "PROCESS_ROWS";
  payload: {
    tables: TableScopeResult<any>[]
  };
};

type ActionTypes = SetScopesAction | ProcessRowsAction;

export const initialStats: Stats = {
  scopesTotal: 0,
  scopesProcessed: 0,
  lastScopeProcessed: '',
  rowsProcessed: 0,
  runStart: new Date(),
  runScopesProcessed: 0,
  runEta: undefined,
};

const calculateEta = (start: Date, processed: number, left: number) => {
  const msPerScope = (Date.now() - start.getTime()) / processed
  logger.info(`${processed}, ${left}`)
  return new Date(Date.now() + left * msPerScope);
}

const reducer = (state: Stats = initialStats, action: ActionTypes) => {
  switch (action.type) {
    case "SET_SCOPES":
      return {
        ...state,
        scopesTotal: action.payload.scopesTotal,
        scopesProcessed: action.payload.scopesProcessed,
        runStart: new Date(),
      };
    case "PROCESS_ROWS": {
      const { tables } = action.payload
      const scopesProcessed = state.scopesProcessed += tables.length
      const rowsProcessed = state.rowsProcessed += tables.reduce((acc, t) => acc + t.rows.length, 0)
      const runScopesProcessed = state.runScopesProcessed + tables.length
      return {
        ...state,
        scopesProcessed,
        rowsProcessed,
        runScopesProcessed,
        lastScopeProcessed: tables.length > 0 ? tables.slice(-1)[0].scope : state.lastScopeProcessed,
        runEta: calculateEta(state.runStart, runScopesProcessed, state.scopesTotal - state.scopesProcessed)
      };
    }
    default:
      return state;
  }
};

let state: Stats
let dispatch: (action: ActionTypes) => void;

const store = {
  setAbi: (abi: Abi) => {
    
  },
  setFromReact: (s:Stats, d: (action: ActionTypes) => void) => {
    state = s;
    dispatch = d;
  },
  getState: () => state,
  dispatch: (action:ActionTypes) => dispatch(action),
}

export { reducer, store };
