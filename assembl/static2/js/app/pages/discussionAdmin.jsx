import React from 'react';
import { connect } from 'react-redux';

import Navbar from '../components/administration/navbar';
import LegalNoticeAndTermsForm from '../components/administration/discussion/legalNoticeAndTermsForm';
import LanguageSection from '../components/administration/discussion/languageSection';

const DiscussionAdmin = (props) => {
  const currentStep = parseInt(props.section, 10);
  return (
    <div className="discussion-admin">
      {props.section === '1' && <LanguageSection {...props} />}
      {props.section === '3' && <LegalNoticeAndTermsForm locale={props.selectedLocale} />}
      {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={1} phaseIdentifier="discussion" />}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    selectedLocale: state.admin.selectedLocale
  };
};

export default connect(mapStateToProps)(DiscussionAdmin);