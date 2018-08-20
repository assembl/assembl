// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import BrightMirrorAdminForm from '../components/administration/brightMirror/index';

type Props = {
  phaseId: string
};

const BrightMirrorAdmin = (props: Props) => (
  <div className="bright-mirror-admin admin-box admin-content">
    <SectionTitle
      title={I18n.t('administration.brightMirrorSection.configureTitle')}
      annotation={I18n.t('administration.timelineAdmin.annotation')}
    />
    <BrightMirrorAdminForm {...props} />
  </div>
);

export default BrightMirrorAdmin;