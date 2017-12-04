// @flow

export const updateCurrentPhaseIdentifier = (currentIdentifier: string) => {
  return {
    currentIdentifier: currentIdentifier,
    type: 'ADD_CURRENT_PHASE_IDENTIFIER'
  };
};

export const updateQueryPhaseIdentifier = (queryIdentifier: string) => {
  return {
    queryIdentifier: queryIdentifier,
    type: 'ADD_QUERY_PHASE_IDENTIFIER'
  };
};