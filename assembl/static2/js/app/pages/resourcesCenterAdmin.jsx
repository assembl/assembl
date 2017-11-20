import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import PageForm from '../components/administration/resourcesCenter/pageForm';
import ManageResourcesForm from '../components/administration/resourcesCenter/manageResourcesForm';

const ResourcesCenterAdmin = ({ selectedLocale }) => {
  return (
    <div>
      <SectionTitle title={I18n.t('administration.resourcesCenter.title')} annotation={I18n.t('administration.annotation')} />
      <PageForm selectedLocale={selectedLocale} />
      <ManageResourcesForm selectedLocale={selectedLocale} />
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    selectedLocale: state.admin.selectedLocale
  };
};

export default connect(mapStateToProps)(ResourcesCenterAdmin);