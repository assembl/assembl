// @flow
import * as React from 'react';
import { withApollo, type ApolloClient } from 'react-apollo';
import { Translate, Localize } from 'react-redux-i18n';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { prefetchMenuQuery } from './menuTable';
import { getPhaseStatus, isSeveralIdentifiers } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';
import { get, goTo } from '../../../utils/routeMap';
import { isMobile, fromGlobalId } from '../../../utils/globalFunctions';
import { PHASE_STATUS, PHASES } from '../../../constants';

export const phasesToIgnore = [PHASES.voteSession];

export type DebateType = {
  debateData: {
    slug: string,
    useSocialMedia: boolean
  }
};

type TimelineSegmentProps = {
  timeline: Timeline,
  index: number,
  client: ApolloClient,
  title: string,
  startDate: string,
  endDate: string,
  phaseIdentifier: string,
  phaseId: string,
  debate: DebateType,
  locale: string,
  active: boolean,
  onSelect: Function,
  onDeselect: Function
};

type TimelineSegmentState = {
  active: boolean
};

export class DumbTimelineSegment extends React.Component<TimelineSegmentProps, TimelineSegmentState> {
  state = {
    active: false
  };

  componentWillMount() {
    const { phaseId, phaseIdentifier, title, startDate, endDate, locale, client } = this.props;
    this.isTouchScreenDevice = isMobile.any();
    this.phaseStatus = getPhaseStatus(startDate, endDate);
    const notStarted = this.phaseStatus === PHASE_STATUS.notStarted;
    const ignore = phasesToIgnore.includes(phaseIdentifier);
    this.ignoreMenu = ignore && !notStarted;
    this.phaseName = title;
    const discussionPhaseId = fromGlobalId(phaseId);
    if (discussionPhaseId && !ignore && !notStarted) {
      // Check discussionPhaseId for flow to be happy, phaseId can't be null, but fromGlobalId can return null.
      // Don't prefetch query if we're not going to use it.
      prefetchMenuQuery(client, {
        lang: locale,
        identifier: phaseIdentifier,
        discussionPhaseId: discussionPhaseId
      });
    }
  }

  phaseStatus = null;

  phaseName = null;

  ignoreMenu = false;

  isTouchScreenDevice = false;

  segment = null;

  select = () => {
    const { onSelect, index } = this.props;
    onSelect(index);
  };

  renderNotStarted = () => {
    const { startDate } = this.props;
    return (
      <div>
        <Translate value="debate.notStarted" phaseName={this.phaseName} />
        <Localize value={startDate} dateFormat="date.format" />
      </div>
    );
  };

  displayPhase = () => {
    const { phaseIdentifier, onDeselect, timeline } = this.props;
    const { debateData } = this.props.debate;
    const params = { slug: debateData.slug, phase: phaseIdentifier };
    const isSeveralPhases = isSeveralIdentifiers(timeline);
    if (isSeveralPhases) {
      if (this.phaseStatus === PHASE_STATUS.notStarted) {
        displayModal(null, this.renderNotStarted(), true, null, null, true);
        onDeselect();
      }
      if (this.phaseStatus === PHASE_STATUS.inProgress || this.phaseStatus === PHASE_STATUS.completed) {
        goTo(get('debate', params));
        onDeselect();
      }
    } else {
      goTo(get('debate', params));
      onDeselect();
    }
  };

  render() {
    const { title, active, showSegmentMenu, index } = this.props;
    const timelineClass = 'timeline-title txt-active-light';
    return (
      <div
        ref={(segment) => {
          this.segment = segment;
        }}
        className={classNames('minimized-timeline', {
          active: active
        })}
        onMouseOver={!this.isTouchScreenDevice ? this.select : showSegmentMenu(index)}
      >
        <div onClick={() => showSegmentMenu(index)} className={timelineClass}>
          <div className="timeline-link">{title}</div>
        </div>
        <span
          className={classNames({
            'assembl-icon-angle-down': showSegmentMenu(index),
            'assembl-icon-angle-right': !showSegmentMenu(index)
          })}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  locale: state.i18n.locale,
  debate: state.debate,
  timeline: state.timeline
});

// $FlowFixMe
export default connect(mapStateToProps)(withApollo(DumbTimelineSegment));