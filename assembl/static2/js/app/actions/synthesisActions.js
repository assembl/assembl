import { getSynthesis } from '../services/synthesisService';

const loadingSynthesis = () => ({
  type: 'FETCH_SYNTHESIS',
  synthesis: null
});

const resolvedFetchSynthesis = synthesis => ({
  type: 'RESOLVED_FETCH_SYNTHESIS',
  synthesis: synthesis
});

const failedFetchSynthesis = error => ({
  type: 'FAILED_FETCH_SYNTHESIS',
  synthesisError: error
});

export const fetchSynthesis = debateId =>
  function (dispatch) {
    dispatch(loadingSynthesis());
    return getSynthesis(debateId)
      .then((synthesis) => {
        dispatch(resolvedFetchSynthesis(synthesis));
      })
      .catch((error) => {
        dispatch(failedFetchSynthesis(error));
      });
  };