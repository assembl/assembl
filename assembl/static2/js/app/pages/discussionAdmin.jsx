import React from 'react';
import Navbar from '../components/administration/navbar';
import LanguageAdmin from '../components/administration/discussion/languageAdmin';
import ManageSectionsForm from '../components/administration/discussion/manageSectionsForm';

const DiscussionAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="discussion-admin">
      {props.section === '1' && <LanguageAdmin {...props} />}
      {props.section === '2' && <ManageSectionsForm {...props} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={2} phaseIdentifier="discussion" />}
    </div>
  );
};

export default DiscussionAdmin;