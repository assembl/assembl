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

export const addRedirectionToV1 = (redirectToV1: string) => {
  return {
    redirectToV1: redirectToV1,
    type: 'REDIRECT_TO_V1'
  };
};