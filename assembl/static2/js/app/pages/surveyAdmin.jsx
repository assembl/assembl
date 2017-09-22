import React from 'react';

import ThemeSection from '../components/administration/survey/themeSection';
import QuestionSection from '../components/administration/survey/questionSection';
import ExportSection from '../components/administration/survey/exportSection';
import Navbar from '../components/administration/navbar';

const SurveyAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="survey-admin">
      {props.section === '1' && <ThemeSection {...props} />}
      {props.section === '2' && <QuestionSection {...props} />}
      {props.section === '3' && <ExportSection {...props} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="survey" />}
    </div>
  );
};

export default SurveyAdmin;