import React from 'react';
import { I18n } from 'react-redux-i18n';
import SectionTitle from '../sectionTitle';

const Question = ({ i18n, showSection }) => {
  return (
    <div className={showSection ? 'shown admin-box' : 'hidden'}>
      <SectionTitle i18n={i18n} phase="survey" tabId="1" annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        question
      </div>
    </div>
  );
};

export default Question;