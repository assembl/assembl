import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import { getDiscussionId } from '../../../utils/globalFunctions';
import SectionTitle from '../sectionTitle';

const ExportSection = ({ i18n }) => {
  const debateId = getDiscussionId();
  return (
    <div className="admin-box">
      <SectionTitle i18n={i18n} phase="survey" tabId="2" annotation={I18n.t('administration.surveyExport.annotation')} />
      <div className="admin-content">
        <Link className="button-link button-dark margin-l" href={`/data/Discussion/${debateId}/phase1_csv_export`}>
          <Translate value="administration.surveyExport.link" />
        </Link>
      </div>
    </div>
  );
};

export default ExportSection;