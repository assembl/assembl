export const PhaseReducer = (state = 'fr', action) => {
  switch (action.type) {
  case 'REDIRECT_TO_V1':
    return { isRedirectionToV1: action.redirectToV1 };
  default:
    return state;
  }
};

export default PhaseReducer;