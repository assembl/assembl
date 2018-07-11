// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import SurveyAdminForm from '../components/administration/survey';

type Props = {
  section: string
};

const SurveyAdmin = ({ section }: Props) => {
  const currentStep = parseInt(section, 10);
  const sectionTitleMsgId = `administration.survey.${currentStep - 1}`;
  return (
    <div className="survey-admin">
      <div className="admin-box">
        <SectionTitle title={I18n.t(sectionTitleMsgId)} annotation={I18n.t('administration.annotation')} />
        <SurveyAdminForm currentStep={currentStep} />
      </div>
    </div>
  );
};

export default SurveyAdmin;