import { getPartners } from '../services/partnersService';

const loadingPartners = () => {
  return {
    type: 'FETCH_PARTNERS',
    partners: null
  };
};

const resolvedFetchPartners = (partners) => {
  return {
    type: 'RESOLVED_FETCH_PARTNERS',
    partners: partners
  };
};

const failedFetchPartners = (error) => {
  return {
    type: 'FAILED_FETCH_PARTNERS',
    partnersError: error
  };
};

export const fetchPartners = (debateId) => {
  return function (dispatch) {
    dispatch(loadingPartners());
    return getPartners(debateId).then((partners) => {
      dispatch(resolvedFetchPartners(partners));
    }).catch((error) => {
      dispatch(failedFetchPartners(error));
    });
  };
};