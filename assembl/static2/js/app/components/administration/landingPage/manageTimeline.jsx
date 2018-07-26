// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Link } from 'react-router';
import { getEntryValueForLocale } from '../../../utils/i18n';
import SectionTitle from '../../administration/sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import PhaseForm from './phaseForm';
import Helper from '../../common/helper';
import { updateLandingPageModuleTitle, updateLandingPageModuleSubtitle } from '../../../actions/adminActions/landingPage';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { get } from '../../../utils/routeMap';

const DumbManageTimeline = ({
  discussionPhaseIds,
  editLocale,
  sectionTitle,
  sectionSubtitle,
  handleTitleChange,
  handleSubtitleChange
}) => {
  const sectionTitlePh = I18n.t('administration.ph.propositionSectionTitle');
  const subtitleSectionPh = I18n.t('administration.ph.propositionSectionSubtitle');
  const slug = { slug: getDiscussionSlug() };
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
          <FormControlWithLabel label={sectionTitlePh} onChange={handleTitleChange} required type="text" value={sectionTitle} />
          <FormControlWithLabel
            label={subtitleSectionPh}
            onChange={handleSubtitleChange}
            required
            type="text"
            value={sectionSubtitle}
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
          <div>
            <Translate value="administration.landingPage.timeline.linkToTimeline" />
            <span>&nbsp;</span>
            <Link to={get('discussionTimelineAdmin', { ...slug })}>
              <Translate value="here" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state, { editLocale }) => {
  const { phasesById } = state.admin.timeline;
  const { modulesById, modulesInOrder } = state.admin.landingPage;
  const timelineModule = modulesInOrder.filter((id) => {
    const module = modulesById.get(id);
    return module.getIn(['moduleType', 'identifier']) === 'TIMELINE';
  });
  return {
    sectionTitle: timelineModule ? getEntryValueForLocale(timelineModule.get('titleEntries'), editLocale, '') : null,
    sectionSubtitle: timelineModule ? getEntryValueForLocale(timelineModule.get('subtitleEntries'), editLocale, '') : null,
    discussionPhaseIds: phasesById
      .filter(phase => !phase.get('_toDelete'))
      .keySeq()
      .toJS(),
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch, { editLocale }) => ({
  handleTitleChange: e => dispatch(updateLandingPageModuleTitle('TIMELINE', editLocale, e.target.value)),
  handleSubtitleChange: e => dispatch(updateLandingPageModuleSubtitle('TIMELINE', editLocale, e.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbManageTimeline);