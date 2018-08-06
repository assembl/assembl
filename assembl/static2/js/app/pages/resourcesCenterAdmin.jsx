// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import ResourcesCenterAdminForm from '../components/administration/resourcesCenter/index';

const ResourcesCenterAdmin = () => (
  <div className="resources-center-admin admin-box admin-content">
    <SectionTitle
      title={I18n.t('administration.resourcesCenter.title')}
      annotation={I18n.t('administration.annotation')}
    />
    <ResourcesCenterAdminForm />
  </div>
);

export default ResourcesCenterAdmin;