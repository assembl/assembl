const DebateReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_DEBATE_DATA':
    return { debateData: null, debateLoading: true, debateError: null };
  case 'RESOLVED_FETCH_DEBATE_DATA':
    return { debateData: action.debateData, debateLoading: false, debateError: null };
  case 'FAILED_FETCH_DEBATE_DATA':
    return { debateData: null, debateLoading: false, debateError: action.debateError };
  default:
    return state;
  }
};

export default DebateReducer;