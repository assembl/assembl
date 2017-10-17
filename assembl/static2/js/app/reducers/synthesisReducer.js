const SynthesisReducer = (state = null, action) => {
  switch (action.type) {
  case 'FETCH_SYNTHESIS':
    return { lastPublishedSynthesis: null, loading: true, error: null };
  case 'RESOLVED_FETCH_SYNTHESIS':
    return {
      lastPublishedSynthesis: {
        creationDate: action.synthesis.lastPublishedSynthesis.creation_date,
        introduction: action.synthesis.lastPublishedSynthesis.introduction,
        publishedInPost: action.synthesis.lastPublishedSynthesis.published_in_post,
        subject: action.synthesis.lastPublishedSynthesis.subject
      },
      loading: false,
      error: null
    };
  case 'FAILED_FETCH_SYNTHESIS':
    return { lastPublishedSynthesis: null, loading: false, error: action.synthesisError };
  default:
    return state;
  }
};

export default SynthesisReducer;