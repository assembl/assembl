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

const getSectionTitle = (section: string, thematicId: string): string | null => {
  if (PHASES_ADMIN_MENU.survey.subMenu.configThematics && thematicId) {
    return 'administration.survey.configThematic';
  }
  const menuItem = getAdminMenuSection(section, PHASES_ADMIN_MENU.survey.subMenu);
  return (menuItem && menuItem.title) || null;
};

const SectionHelper = ({ section, thematicId }: Props) => {
  if (thematicId) return null;
  switch (section) {
  case '1':
    return (
      <div className="section-helper">
        <h4 className="section-helper-title">{I18n.t('administration.survey.configThematicsHelperTitle')}</h4>
        <div className="section-helper-description">{I18n.t('administration.survey.configThematicsHelperDescription')}</div>
      </div>
    );
  default:
    return null;
  }
};

const SurveyAdmin = ({ section, thematicId }: Props) => {
  const sectionTitleMsgId = getSectionTitle(section, thematicId);
  return (
    <div className="survey-admin">
      <div className="admin-box">
        <SectionTitle title={I18n.t(sectionTitleMsgId)} annotation={I18n.t('administration.annotation')} />
        <SectionHelper section={section} thematicId={thematicId} />
        <SurveyAdminForm section={section} thematicId={thematicId} />
      </div>
    </div>
  );
};

export default SurveyAdmin;