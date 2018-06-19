// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import SectionTitle from '../../administration/sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import PhaseForm from './phaseForm';
import Helper from '../../common/helper';

const DumbManageTimeline = ({ discussionPhaseIds, editLocale }) => {
  const titleSectionPh = I18n.t('administration.ph.propositionSectionTitle');
  const subtitleSectionPh = I18n.t('administration.ph.propositionSectionSubtitle');
  const handleButtonLabelChange = () => {};
  return (
    <div className="admin-box">
      <SectionTitle
        title={I18n.t('administration.landingPage.timeline.title')}
        annotation={I18n.t('administration.annotation')}
      />
      <div className="admin-content">
        <div className="form-container">
          <Helper
            label={I18n.t('administration.landingPage.timeline.sectionTitle')}
            helperUrl="/static2/img/helpers/landing_page_admin/timeline_title.png"
            helperText={I18n.t('administration.helpers.timelineTitle')}
            classname="title"
          />
          <FormControlWithLabel
            label={titleSectionPh}
            onChange={handleButtonLabelChange}
            required
            type="text"
            value={titleSectionPh}
          />
          <FormControlWithLabel
            label={subtitleSectionPh}
            onChange={handleButtonLabelChange}
            required
            type="text"
            value={subtitleSectionPh}
          />
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
};

const mapStateToProps = (state, { editLocale }) => {
  const { phasesInOrder } = state.admin.timeline;
  return {
    discussionPhaseIds: phasesInOrder,
    editLocale: editLocale
  };
};

export default connect(mapStateToProps)(DumbManageTimeline);