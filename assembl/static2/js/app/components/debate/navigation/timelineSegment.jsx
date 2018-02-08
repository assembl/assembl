// @flow
import React from 'react';
import { withApollo, type ApolloClient } from 'react-apollo';
import { browserHistory } from 'react-router';
import { Translate, Localize } from 'react-redux-i18n';
import { connect } from 'react-redux';
import classNames from 'classnames';

import MenuTable, { prefetchMenuQuery } from './menuTable';
import { getPhaseStatus, isSeveralIdentifiers, type Timeline } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';
import { get } from '../../../utils/routeMap';
import { PHASE_STATUS } from '../../../constants';

export type DebateType = {
  debateData: {
    timeline: Timeline,
    slug: string
  }
};

type TimelineSegmentProps = {
  client: ApolloClient,
  title: {
    entries: Array<*>
  },
  startDate: string,
  endDate: string,
  phaseIdentifier: string,
  debate: DebateType,
  barPercent: number,
  locale: string,
  onMenuItemClick: Function
};

type TimelineSegmentState = {
  active: boolean
};

export class DumbTimelineSegment extends React.Component<*, TimelineSegmentProps, TimelineSegmentState> {
  state = {
    active: false
  };

  componentWillMount() {
    const { phaseIdentifier, title, startDate, endDate, locale, client } = this.props;
    this.phaseStatus = getPhaseStatus(startDate, endDate);
    let phaseName = '';
    title.entries.forEach((entry) => {
      if (locale === entry['@language']) {
        phaseName = entry.value.toLowerCase();
      }
    });
    this.phaseName = phaseName;
    prefetchMenuQuery(client, {
      lang: locale,
      identifier: phaseIdentifier
    });
  }

  phaseStatus = null;

  phaseName = null;

  showMenu = () => {
    this.setState({ active: true });
  };

  hideMenu = () => {
    this.setState({ active: false });
  };

  renderNotStarted = (className?: string) => {
    const { startDate } = this.props;
    return (
      <div className={className}>
        <Translate value="debate.notStarted" phaseName={this.phaseName} />
        <Localize value={startDate} dateFormat="date.format" />
      </div>
    );
  };

  displayPhase = () => {
    const { phaseIdentifier } = this.props;
    const { debateData } = this.props.debate;
    const phase = debateData.timeline.filter(p => p.identifier === phaseIdentifier);
    const isRedirectionToV1 = phase[0].interface_v1;
    const slug = { slug: debateData.slug };
    const params = { slug: debateData.slug, phase: phaseIdentifier };
    const isSeveralPhases = isSeveralIdentifiers(debateData.timeline);
    if (isSeveralPhases) {
      if (this.phaseStatus === PHASE_STATUS.notStarted) {
        const body = this.renderNotStarted();
        displayModal(null, body, true, null, null, true);
      }
      if (this.phaseStatus === PHASE_STATUS.inProgress || this.phaseStatus === PHASE_STATUS.completed) {
        if (!isRedirectionToV1) {
          browserHistory.push(get('debate', params));
          this.hideMenu();
        } else {
          window.location = get('oldVote', slug);
        }
      }
    } else if (!isRedirectionToV1) {
      browserHistory.push(get('debate', params));
      this.hideMenu();
    } else {
      window.location = get('oldVote', slug);
    }
  };

  renderMenu = () => {
    const { phaseIdentifier, onMenuItemClick } = this.props;
    const { active } = this.state;
    const isNotStarted = this.phaseStatus === PHASE_STATUS.notStarted;
    if (!active) return null;
    return (
      <div className="menu-container">
        {isNotStarted ? (
          this.renderNotStarted('not-started')
        ) : (
          <MenuTable identifier={phaseIdentifier} onMenuItemClick={onMenuItemClick} />
        )}
      </div>
    );
  };

  render() {
    const { barPercent, title, locale } = this.props;
    const { active } = this.state;
    const timelineClass = 'timeline-title txt-active-light';
    return (
      <div
        className={classNames('minimized-timeline', {
          active: active
        })}
        onMouseOver={this.showMenu}
        onMouseLeave={this.hideMenu}
      >
        {title.entries.filter(entry => locale === entry['@language']).map((entry, index) => (
          <div onClick={this.displayPhase} className={timelineClass} key={index}>
            <div className="timeline-link">{entry.value}</div>
          </div>
        ))}
        <div className="timeline-graph">
          <div className="timeline-bars">
            {barPercent > 0 && (
              <div className="timeline-bar-filler" style={barPercent < 20 ? { width: '20%' } : { width: `${barPercent}%` }}>
                &nbsp;
              </div>
            )}
            <div className="timeline-bar-background">&nbsp;</div>
          </div>
        </div>
        {active && <span className="timeline-arrow" />}
        {this.renderMenu()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  locale: state.i18n.locale,
  debate: state.debate
});

// $FlowFixMe
export default connect(mapStateToProps)(withApollo(DumbTimelineSegment));