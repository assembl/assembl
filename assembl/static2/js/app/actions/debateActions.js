import DebateService from '../services/debateService';

class DebateActions {
  static fetchDebateData(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingDebateData());
      return DebateService.fetchDebateData(debateId).then((debateData) => {
        dispatch(that.resolvedFetchDebateData(debateData));
      }).catch((error) => {
        dispatch(that.failedFetchDebateData(error));
      });
    };
  }
  static loadingDebateData() {
    return {
      type: 'FETCH_DEBATE_DATA',
      debateData: null
    };
  }
  static resolvedFetchDebateData(debateData) {
    return {
      type: 'RESOLVED_FETCH_DEBATE_DATA',
      debateData: debateData
    };
  }
  static failedFetchDebateData(error) {
    return {
      type: 'FAILED_FETCH_DEBATE_DATA',
      debateError: error
    };
  }
}

export default DebateActions;