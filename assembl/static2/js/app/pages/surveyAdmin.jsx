import React from 'react';

import ThemeSection from '../components/administration/survey/themeSection';
import QuestionSection from '../components/administration/survey/questionSection';
import ExportSection from '../components/administration/survey/exportSection';
import Navbar from '../components/administration/navbar';

const SurveyAdmin = ({ section }) => {
  const currentStep = parseInt(section, 10);
  return (
    <div className="survey-admin">
      {section === '1' && <ThemeSection />}
      {section === '2' && <QuestionSection />}
      {section === '3' && <ExportSection />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="survey" />}
    </div>
  );
};


export default SurveyAdmin;