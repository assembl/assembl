// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import SurveyAdminForm from '../components/administration/survey';
import { PHASES_ADMIN_MENU } from '../constants';
import { getAdminMenuSection } from '../utils/administration/menu';

type Props = {
  section: string,
  thematicId: string
};

const SurveyAdmin = ({ section, thematicId }: Props) => {
  const menuItem = getAdminMenuSection(section, PHASES_ADMIN_MENU.survey.subMenu);
  const sectionTitleMsgId = menuItem && menuItem.title;
  return (
    <div className="survey-admin">
      <div className="admin-box">
        <SectionTitle title={I18n.t(sectionTitleMsgId)} annotation={I18n.t('administration.annotation')} />
        <SurveyAdminForm section={section} thematicId={thematicId} />
      </div>
    </div>
  );
};

export default SurveyAdmin;