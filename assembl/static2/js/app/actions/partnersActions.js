import PartnersService from '../services/partnersService';

class PartnersActions {
  static fetchPartners(debateId) {
    const that = this;
    return function (dispatch) {
      dispatch(that.loadingPartners());
      return PartnersService.fetchPartners(debateId).then((partners) => {
        dispatch(that.resolvedFetchPartners(partners));
      }).catch((error) => {
        dispatch(that.failedFetchPartners(error));
      });
    };
  }
  static loadingPartners() {
    return {
      type: 'FETCH_PARTNERS',
      partners: null
    };
  }
  static resolvedFetchPartners(partners) {
    return {
      type: 'RESOLVED_FETCH_PARTNERS',
      partners: partners
    };
  }
  static failedFetchPartners(error) {
    return {
      type: 'FAILED_FETCH_PARTNERS',
      partnersError: error
    };
  }
}

export default PartnersActions;