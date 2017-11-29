import React from 'react';
import Navbar from '../components/administration/navbar';
import LanguageSection from '../components/administration/discussion/languageSection';

const DiscussionAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="discussion-admin">
      {props.section === '1' && <LanguageSection {...props} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={1} phaseIdentifier="discussion" />}
    </div>
  );
};

export default DiscussionAdmin;