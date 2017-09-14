import React from 'react';
import Navbar from '../components/administration/navbar';
import LanguageAdmin from '../components/administration/discussion/languageAdmin';

const DiscussionAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="discussion-admin">
      {props.section === '1' && <LanguageAdmin {...props} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={1} phaseIdentifier="discussion" />}
    </div>
  );
};

export default DiscussionAdmin;