import { getDebateData } from '../services/debateService';

const loadingDebateData = () => {
  return {
    type: 'FETCH_DEBATE_DATA',
    debateData: null
  };
};

const resolvedFetchDebateData = (debateData) => {
  return {
    type: 'RESOLVED_FETCH_DEBATE_DATA',
    debateData: debateData
  };
};

const failedFetchDebateData = (error) => {
  return {
    type: 'FAILED_FETCH_DEBATE_DATA',
    debateError: error
  };
};

export const fetchDebateData = (debateId) => {
  return function (dispatch) {
    dispatch(loadingDebateData());
    return getDebateData(debateId).then((debateData) => {
      dispatch(resolvedFetchDebateData(debateData));
    }).catch((error) => {
      dispatch(failedFetchDebateData(error));
    });
  };
};