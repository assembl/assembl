const AdminReducer = (state = {}, action) => {
  switch (action.type) {
  case 'ADD_ADMIN_DATA':
    return {
      selectedLocale: action.selectedLocale,
      surveyData: action.surveyData
    };
  default:
    return state;
  }
};

export default AdminReducer;