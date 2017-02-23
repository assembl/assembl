const IdeaReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_IDEAS':
    return { ideas: null, ideasLoading: true, ideasError: null };
  case 'RESOLVED_FETCH_IDEAS':
    return { ideas: action.ideas, ideasLoading: false, ideasError: null };
  case 'FAILED_FETCH_IDEAS':
    return { ideas: null, ideasLoading: false, ideasError: action.ideasError };
  default:
    return state;
  }
};

export default IdeaReducer;