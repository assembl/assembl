import DebateService from '../services/debateService';

class DebateActions {
  static fetchDebateData(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingDebateData());
      return DebateService.fetchDebateData(debateId).then((response) => {
        dispatch(that.resolvedFetchDebateData(response));
      }).catch((error) => {
        dispatch(that.failedFetchDebateData(error));
      });
    };
  }
  static loadingDebateData() {
    return {
      type: 'FETCH_DEBATE_DATA',
      payload: null
    };
  }
  static resolvedFetchDebateData(debateData) {
    return {
      type: 'RESOLVED_FETCH_DEBATE_DATA',
      payload: debateData
    };
  }
  static failedFetchDebateData(err) {
    return {
      type: 'FAILED_FETCH_DEBATE_DATA',
      error: err
    };
  }
}

export default DebateActions;