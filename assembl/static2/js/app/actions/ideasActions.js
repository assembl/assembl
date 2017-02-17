import IdeaService from '../services/ideaService';

class IdeasActions {
  static fetchIdeas(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingIdeas());
      setTimeout(() => {
        const ideas = IdeaService.fetchIdeas(debateId);
        dispatch(that.resolvedFetchIdeas(ideas));
      }, 5000);
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