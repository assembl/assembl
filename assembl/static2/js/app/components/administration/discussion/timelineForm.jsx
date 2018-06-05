// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import SectionTitle from '../sectionTitle';

const TimeLineForm = () => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.discussion.5')} annotation={I18n.t('administration.timelineAdmin.annotation')} />
    <div className="admin-content">
      <div>
        Some content
      </div>
    </div>
  </div>
);

export default TimeLineForm;