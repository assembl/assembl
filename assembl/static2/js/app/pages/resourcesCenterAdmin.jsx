import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import PageForm from '../components/administration/resourcesCenter/pageForm';
import ManageResourcesForm from '../components/administration/resourcesCenter/manageResourcesForm';

const ResourcesCenterAdmin = ({ editLocale }) => (
  <div className="resources-center-admin admin-box">
    <SectionTitle title={I18n.t('administration.resourcesCenter.title')} annotation={I18n.t('administration.annotation')} />
    <PageForm editLocale={editLocale} />
    <ManageResourcesForm editLocale={editLocale} />
  </div>
);

const mapStateToProps = state => ({
  editLocale: state.admin.editLocale
});

export default connect(mapStateToProps)(ResourcesCenterAdmin);