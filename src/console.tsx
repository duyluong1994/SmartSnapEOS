import React from "react";
import { Color, Box, Static, Text, render as renderReact } from "ink";
// @ts-ignore
import BorderBox from "ink-box";
import { formatDistance, isValid } from "date-fns";
import { Stats, store, reducer, initialStats } from "./stats";

const Console = () => {
  const [state, dispatch] = React.useReducer(reducer, initialStats);
  // do not use in React.useEffect as we want to update it immediately
  store.setFromReact(state, dispatch);

  const eta = isValid(state.runEta)
    ? formatDistance(state.runEta!, new Date())
    : `NA`;

  return (
    <Box padding={1} width={100} flexDirection="column">
      <Color blueBright>
        <Box
          width="100%"
          flexDirection="column"
          justifyContent="flex-start"
          alignItems="center"
        >
          <Text bold>{`Scopes processed: ${state.scopesProcessed} / ${
            state.scopesTotal
          }`}</Text>
          <Text>{`Rows processed in current run: ${state.rowsProcessed}`}</Text>
          <Box width="100%" flexDirection="row" justifyContent="center">
            <Box marginRight={2}>
              <Text>{`ETA: ${eta}`}</Text>
            </Box>
            <Box>
              <Text italic>({state.lastScopeProcessed})</Text>
            </Box>
          </Box>
        </Box>
      </Color>
      <Color yellow>
        <Box>
          {JSON.stringify(state.rowStats)}
        </Box>
      </Color>
    </Box>
  );
};

const render = () => renderReact(<Console />);

export { render };
