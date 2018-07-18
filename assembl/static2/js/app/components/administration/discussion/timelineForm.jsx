// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import range from 'lodash/range';

import { addPhaseTooltip } from '../../common/tooltips';
import TabbedContent from '../../common/tabbedContent';
import SectionTitle from '../sectionTitle';
import PhaseForm from './phaseForm';
import { createRandomId, getDiscussionSlug } from '../../../utils/globalFunctions';
import { createPhase } from '../../../actions/adminActions/timeline';
import PhaseTitleForm from './phaseTitleForm';
import { get } from '../../../utils/routeMap';

type TimelineFormProps = {
  editLocale: string,
  phases: Array<string>,
  handleCreatePhase: Function
};

type TimelineFormState = {
  selectedPhaseId: string
};

export class DumbTimelineForm extends React.Component<TimelineFormProps, TimelineFormState> {
  componentDidUpdate() {
    const { length } = this.props.phases;
    if (length === 0) {
      range(4).forEach((number) => {
        this.props.handleCreatePhase(number + 1);
      });
    }
  }

  getPhaseNumberById = (id: string) => this.props.phases.indexOf(id) + 1;

  render() {
    const { editLocale, phases, handleCreatePhase } = this.props;
    const slug = { slug: getDiscussionSlug() };
    return (
      <div className="admin-box timeline-admin">
        <SectionTitle
          title={I18n.t('administration.discussion.5')}
          annotation={I18n.t('administration.timelineAdmin.annotation')}
        />
        <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
        <div className="admin-content">
          <div className="form-container">
            <form>
              {phases &&
                phases.map((id, index) => (
                  <PhaseTitleForm
                    key={`phase-title-form-${id}`}
                    id={id}
                    editLocale={editLocale}
                    phaseIndex={index + 1}
                    numberOfPhases={phases.length}
                  />
                ))}
              <OverlayTrigger placement="top" overlay={addPhaseTooltip}>
                <div
                  onClick={() => {
                    handleCreatePhase(phases.length);
                  }}
                  className="plus margin-s"
                >
                  +
                </div>
              </OverlayTrigger>
            </form>
          </div>
          <div className="margin-l">
            <Translate value="administration.landingPage.timeline.linkToLandingPage" />
            <span>&nbsp;</span>
            <Link to={get('landingPageTimelineAdmin', { ...slug })}>
              <Translate value="here" />
            </Link>
          </div>
        </div>
        <Translate value="administration.timelineAdmin.instruction2" className="admin-instruction" />

        {phases && (
          <TabbedContent
            divClassName="admin-content"
            tabs={phases.map((id, index) => ({
              id: id,
              title: I18n.t('administration.timelineAdmin.phase', { count: index + 1 })
            }))}
            renderBody={tab => (
              <PhaseForm
                key={`phase-form-${tab.id}-${editLocale}`}
                phaseId={tab.id}
                phaseNumber={this.getPhaseNumberById(tab.id)}
              />
            )}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { phasesById } = state.admin.timeline;
  const filteredPhases = phasesById.sortBy(phase => phase.get('order')).filter(phase => !phase.get('_toDelete'));
  const filteredPhasesId = filteredPhases.keySeq().toJS();
  return {
    editLocale: state.admin.editLocale,
    lang: state.i18n.locale,
    phases: filteredPhasesId
  };
};

const mapDispatchToProps = dispatch => ({
  handleCreatePhase: (nextOrder) => {
    const newId = createRandomId();
    return dispatch(createPhase(newId, nextOrder));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbTimelineForm);