import React from 'react';
import { connect } from 'react-redux';

import Theme from '../components/administration/survey/theme';
import Question from '../components/administration/survey/question';
import Export from '../components/administration/survey/export';
import Navbar from '../components/administration/navbar';

const SurveyAdmin = ({ i18n, section }) => {
  const currentStep = parseInt(section, 10);
  return (
    <div className="survey-admin">
      <Theme i18n={i18n} showSection={section === '1'} />
      <Question i18n={i18n} showSection={section === '2'} />
      <Export i18n={i18n} showSection={section === '3'} />
      {!isNaN(currentStep) &&
        <Navbar
          currentStep={currentStep}
          totalSteps={3}
          phaseIdentifier="survey"
        />
      }
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(SurveyAdmin);