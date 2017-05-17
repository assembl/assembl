export const updateCurrentPhaseIdentifier = (currentIdentifier) => {
  return {
    currentIdentifier: currentIdentifier,
    type: 'ADD_CURRENT_PHASE_IDENTIFIER'
  };
};

export const updateQueryPhaseIdentifier = (queryIdentifier) => {
  return {
    queryIdentifier: queryIdentifier,
    type: 'ADD_QUERY_PHASE_IDENTIFIER'
  };
};

export const addRedirectionToV1 = (redirectToV1) => {
  return {
    redirectToV1: redirectToV1,
    type: 'REDIRECT_TO_V1'
  };
};