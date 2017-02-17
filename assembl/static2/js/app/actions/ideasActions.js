import IdeaService from '../services/ideaService';

class IdeasActions {
  static fetchIdeas(debateId) {
    const that = this;
    return function (dispatch) {
      const ideas = IdeaService.fetchIdeas(debateId);
      dispatch(that.resolvedFetchIdeas(ideas));
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