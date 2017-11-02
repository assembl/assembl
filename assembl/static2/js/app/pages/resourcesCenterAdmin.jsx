import React from 'react';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';

const ResourcesCenterAdmin = () => {
  return (
    <div>
      <SectionTitle title={I18n.t('administration.resourcesCenter.title')} annotation={I18n.t('administration.annotation')} />
    </div>
  );
};

export default ResourcesCenterAdmin;