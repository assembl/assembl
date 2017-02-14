const SynthesisReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_SYNTHESIS':
    return { synthesis: null, synthesisLoading: true, synthesisError: null };
  case 'RESOLVED_FETCH_SYNTHESIS':
    return { synthesis: action.synthesis, synthesisLoading: false, synthesisError: null };
  case 'FAILED_FETCH_SYNTHESIS':
    return { synthesis: null, synthesisLoading: false, synthesisError: action.synthesisError };
  default:
    return state;
  }
};

export default SynthesisReducer;