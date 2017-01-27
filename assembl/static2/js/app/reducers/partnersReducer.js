const PartnersReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_PARTNERS':
    return { partners: null, partnersLoading: true, partnersError: null };
  case 'RESOLVED_FETCH_PARTNERS':
    return { partners: action.partners, partnersLoading: false, partnersError: null };
  case 'FAILED_FETCH_PARTNERS':
    return { partners: null, partnersLoading: false, partnersError: action.partnersError };
  default:
    return state;
  }
};

export default PartnersReducer;