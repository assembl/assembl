import SynthesisService from '../services/synthesisService';

class SynthesisActions {
  static fetchSynthesis(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingSynthesis());
      return SynthesisService.fetchSynthesis(debateId).then((synthesis) => {
        dispatch(that.resolvedFetchSynthesis(synthesis));
      }).catch((error) => {
        dispatch(that.failedFetchSynthesis(error));
      });
    };
  }
  static loadingSynthesis() {
    return {
      type: 'FETCH_SYNTHESIS',
      synthesis: null
    };
  }
  static resolvedFetchSynthesis(synthesis) {
    return {
      type: 'RESOLVED_FETCH_SYNTHESIS',
      synthesis: synthesis
    };
  }
  static failedFetchSynthesis(error) {
    return {
      type: 'FAILED_FETCH_SYNTHESIS',
      synthesisError: error
    };
  }
}

export default SynthesisActions;