import React from 'react';
import Navbar from '../components/administration/navbar';
import LanguageAdmin from '../components/administration/discussion/languageAdmin';

const DiscussionAdmin = ({ section }) => {
  const currentStep = parseInt(section, 10);
  return (
    <div className="discussion-admin">
      {section === '1' && <LanguageAdmin />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={1} phaseIdentifier="discussion" />}
    </div>
  );
};

export default DiscussionAdmin;