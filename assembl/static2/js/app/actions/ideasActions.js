import { getIdeas } from '../services/ideasService';

const loadingIdeas = () => {
  return {
    type: 'FETCH_IDEAS',
    ideas: null
  };
};

const resolvedFetchIdeas = (ideas) => {
  return {
    type: 'RESOLVED_FETCH_IDEAS',
    ideas: ideas
  };
};

const failedFetchIdeas = (error) => {
  return {
    type: 'FAILED_FETCH_IDEAS',
    ideaError: error
  };
};

export const fetchIdeas = (debateId) => {
  return function (dispatch) {
    dispatch(loadingIdeas());
    return getIdeas(debateId).then((ideas) => {
      dispatch(resolvedFetchIdeas(ideas));
    }).catch((error) => {
      dispatch(failedFetchIdeas(error));
    });
  };
};