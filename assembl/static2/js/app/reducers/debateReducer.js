const DebateReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_DEBATE_DATA':
    return { debateData: null, debateLoading: true, debateError: null, isUnauthorized: false };
  case 'RESOLVED_FETCH_DEBATE_DATA':
    return { debateData: action.debateData, debateLoading: false, debateError: null, isUnauthorized: false };
  case 'FAILED_FETCH_DEBATE_DATA':
    return { debateData: null, debateLoading: false, debateError: action.debateError, isUnauthorized: false };
  case 'UNAUTHORIZED_DEBATE_DATA':
    return { debateData: null, debateLoading: false, debateError: null, isUnauthorized: true };
  default:
    return state;
  }
};

export default DebateReducer;