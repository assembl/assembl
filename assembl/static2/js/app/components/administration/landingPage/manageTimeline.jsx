// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import SectionTitle from '../../administration/sectionTitle';
import PhaseForm from './phaseForm';
import Helper from '../../common/helper';

type Props = {
  timelineModuleId: string, // eslint-disable-line react/no-unused-prop-types
  discussionPhaseIds: Array<string>,
  editLocale: string
};

const DumbManageTimeline = ({ discussionPhaseIds, editLocale }: Props) => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.landingPage.timeline.title')} annotation={I18n.t('administration.annotation')} />
    <div className="admin-content">
      <div className="form-container">
        <div className="margin-l">
          <Helper
            label={I18n.t('administration.landingPage.timeline.phaseSection')}
            helperUrl="/static2/img/helpers/landing_page_admin/timeline_phase.png"
            helperText={I18n.t('administration.helpers.timelinePhases')}
            classname="title"
          />
          {discussionPhaseIds.map((phaseId, index) => (
            <PhaseForm key={`phase-${index}`} phaseId={phaseId} editLocale={editLocale} index={index} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const mapStateToProps = (state, { editLocale }) => {
  const { phasesById } = state.admin.timeline;
  return {
    discussionPhaseIds: phasesById
      .filter(phase => !phase.get('_toDelete'))
      .keySeq()
      .toJS(),
    editLocale: editLocale
  };
};

export default connect(mapStateToProps)(DumbManageTimeline);