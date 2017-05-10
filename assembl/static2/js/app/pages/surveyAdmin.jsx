import React from 'react';
import { connect } from 'react-redux';

import ThemeCreation from '../components/administration/survey/themeCreation';
import ThemeEdition from '../components/administration/survey/themeEdition';
import SurveyExport from '../components/administration/survey/surveyExport';

const SurveyAdmin = ({ i18n, section }) => {
  return (
    <div className="survey-admin">
      <ThemeCreation i18n={i18n} showSection={section === 'section1'} />
      <ThemeEdition i18n={i18n} showSection={section === 'section2'} />
      <SurveyExport i18n={i18n} showSection={section === 'section3'} />
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(SurveyAdmin);