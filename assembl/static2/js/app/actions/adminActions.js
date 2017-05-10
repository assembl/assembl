const resolvedAddAdminData = (selectedLocale, surveyData) => {
  return {
    type: 'ADD_ADMIN_DATA',
    selectedLocale: selectedLocale,
    surveyData: surveyData
  };
};

export const addAdminData = (selectedLocale, surveyData) => {
  return function (dispatch) {
    dispatch(resolvedAddAdminData(selectedLocale, surveyData));
  };
};