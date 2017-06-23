import { getSynthesis } from '../services/synthesisService';

const loadingSynthesis = () => {
  return {
    type: 'FETCH_SYNTHESIS',
    synthesis: null
  };
};

const resolvedFetchSynthesis = (synthesis) => {
  return {
    type: 'RESOLVED_FETCH_SYNTHESIS',
    synthesis: synthesis
  };
};

const failedFetchSynthesis = (error) => {
  return {
    type: 'FAILED_FETCH_SYNTHESIS',
    synthesisError: error
  };
};

export const fetchSynthesis = (debateId) => {
  return function (dispatch) {
    dispatch(loadingSynthesis());
    return getSynthesis(debateId)
      .then((synthesis) => {
        dispatch(resolvedFetchSynthesis(synthesis));
      })
      .catch((error) => {
        dispatch(failedFetchSynthesis(error));
      });
  };
};