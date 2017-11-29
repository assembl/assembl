import React from 'react';
import Navbar from '../components/administration/navbar';
import ManageSectionsForm from '../components/administration/discussion/manageSectionsForm';
import LanguageSection from '../components/administration/discussion/languageSection';

const DiscussionAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="discussion-admin">
      {props.section === '1' && <LanguageSection {...props} />}
      {props.section === '2' && <ManageSectionsForm {...props} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={2} phaseIdentifier="discussion" />}
    </div>
  );
};

export default DiscussionAdmin;