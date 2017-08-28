import React from 'react';
import Navbar from '../components/administration/navbar';
import LanguageAdmin from '../components/administration/languageAdmin';

const DiscussionAdmin = ({ section }) => {
  const currentStep = parseInt(section, 10);
  return (
    <div className="discussion-admin">
      {section === '1' && <LanguageAdmin />}
      {/*{!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="survey" />} */}
    </div>
  );
};

export default DiscussionAdmin;