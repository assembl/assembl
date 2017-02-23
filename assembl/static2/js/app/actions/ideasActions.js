import IdeasService from '../services/ideasService';

class IdeasActions {
  static fetchIdeas(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingIdeas());
      return IdeasService.fetchIdeas(debateId).then((ideas) => {
        dispatch(that.resolvedFetchIdeas(ideas));
      }).catch((error) => {
        dispatch(that.failedFetchIdeas(error));
      });
    };
  }
  static loadingIdeas() {
    return {
      type: 'FETCH_IDEAS',
      ideas: null
    };
  }
  static resolvedFetchIdeas(ideas) {
    return {
      type: 'RESOLVED_FETCH_IDEAS',
      ideas: ideas
    };
  }
  static failedFetchIdeas(error) {
    return {
      type: 'FAILED_FETCH_IDEAS',
      ideaError: error
    };
  }
}

export default IdeasActions;