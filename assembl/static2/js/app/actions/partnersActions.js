import { getPartners } from '../services/partnersService';

const loadingPartners = () => ({
  type: 'FETCH_PARTNERS',
  partners: null
});

const resolvedFetchPartners = partners => ({
  type: 'RESOLVED_FETCH_PARTNERS',
  partners: partners
});

const failedFetchPartners = error => ({
  type: 'FAILED_FETCH_PARTNERS',
  partnersError: error
});

export const fetchPartners = debateId =>
  function (dispatch) {
    dispatch(loadingPartners());
    return getPartners(debateId)
      .then((partners) => {
        dispatch(resolvedFetchPartners(partners));
      })
      .catch((error) => {
        dispatch(failedFetchPartners(error));
      });
  };