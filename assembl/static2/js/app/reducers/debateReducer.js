const DebateReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_DEBATE_DATA':
    return { debateData: null, loading: true, error: null };
  case 'RESOLVED_FETCH_DEBATE_DATA':
    return { debateData: action.payload, loading: false, error: null };
  case 'FAILED_FETCH_DEBATE_DATA':
    return { debateData: null, loading: false, error: action.error };
  default:
    return state;
  }
};

export default DebateReducer;