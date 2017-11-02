import React from 'react';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import PageForm from '../components/administration/resourcesCenter/pageForm';
import ManageResourcesForm from '../components/administration/resourcesCenter/manageResourcesForm';

const ResourcesCenterAdmin = () => {
  return (
    <div>
      <SectionTitle title={I18n.t('administration.resourcesCenter.title')} annotation={I18n.t('administration.annotation')} />
      <PageForm />
      <ManageResourcesForm />
    </div>
  );
};

export default ResourcesCenterAdmin;