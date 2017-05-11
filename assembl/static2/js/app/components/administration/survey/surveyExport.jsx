import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import { getDiscussionId } from '../../../utils/globalFunctions';
import SectionTitle from '../sectionTitle';

const surveyExport = ({ i18n, showSection }) => {
  const debateId = getDiscussionId();
  return (
    <div className={showSection ? 'shown' : 'hidden'}>
      <SectionTitle i18n={i18n} phase="survey" tabId="2" annotation={I18n.t('administration.surveyExport.annotation')} />
      <div className="admin-content">
        <Link className="button-link button-dark margin-l" href={`/data/Discussion/${debateId}/phase1_csv_export`}>
          <Translate value="administration.surveyExport.link" />
        </Link>
      </div>
    </div>
  );
};

export default surveyExport;