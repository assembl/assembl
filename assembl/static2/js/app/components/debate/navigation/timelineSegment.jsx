// @flow
import React from 'react';
import { withApollo, type ApolloClient } from 'react-apollo';
import { Translate, Localize } from 'react-redux-i18n';
import { connect } from 'react-redux';
import classNames from 'classnames';

import MenuTable, { prefetchMenuQuery } from './menuTable';
import { getPhaseStatus, isSeveralIdentifiers, type Timeline } from '../../../utils/timeline';
import { displayModal } from '../../../utils/utilityManager';
import { get, goTo } from '../../../utils/routeMap';
import { isMobile } from '../../../utils/globalFunctions';
import { PHASE_STATUS, PHASES } from '../../../constants';

const phasesToIgnore = [PHASES.voteSession];

export type MenuClickEvent = {
  path: Array<HTMLElement>
};

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
    this.isTouchScreenDevice = isMobile.any();
    this.phaseStatus = getPhaseStatus(startDate, endDate);
    const inProgress = this.phaseStatus === PHASE_STATUS.inProgress;
    const ignore = phasesToIgnore.includes(phaseIdentifier);
    this.ignoreMenu = ignore && !inProgress;
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

  componentDidMount() {
    // only if we have a touch screen device, we need to hide the segment if the
    // user touch outside of the segment block (simulate the onMouseLeave behavior).
    if (this.isTouchScreenDevice) {
      document.addEventListener('click', this.handleTouchOutside);
    }
  }

  componentWillUnmount() {
    if (this.isTouchScreenDevice) {
      document.removeEventListener('click', this.handleTouchOutside);
    }
  }

  phaseStatus = null;

  phaseName = null;

  ignoreMenu = false;

  isTouchScreenDevice = false;

  segment = null;

  showMenu = () => {
    this.setState({ active: true });
  };

  hideMenu = () => {
    this.setState({ active: false });
  };

  handleTouchOutside = (event: MouseEvent) => {
    if (this.state.active && this.segment && !this.segment.contains(event.target)) {
      this.hideMenu();
    }
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
    const { phaseIdentifier, onMenuItemClick } = this.props;
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
          goTo(get('debate', params));
          this.hideMenu();
          if (onMenuItemClick) onMenuItemClick();
        } else {
          window.location = get('oldVote', slug);
        }
      }
    } else if (!isRedirectionToV1) {
      goTo(get('debate', params));
      this.hideMenu();
      if (onMenuItemClick) onMenuItemClick();
    } else {
      window.location = get('oldVote', slug);
    }
  };

  renderMenu = () => {
    const { active } = this.state;
    if (!active) return null;
    const { phaseIdentifier, onMenuItemClick } = this.props;
    const isNotStarted = this.phaseStatus === PHASE_STATUS.notStarted;
    if (isNotStarted) {
      return <div className="menu-container">{this.renderNotStarted('not-started')}</div>;
    }
    if (!this.ignoreMenu) {
      return (
        <div className="menu-container">
          <MenuTable identifier={phaseIdentifier} onMenuItemClick={onMenuItemClick} />
        </div>
      );
    }
    return null;
  };

  render() {
    const { barPercent, title, locale } = this.props;
    const { active } = this.state;
    const inProgress = this.phaseStatus === PHASE_STATUS.inProgress;
    const timelineClass = 'timeline-title txt-active-light';
    const touchActive = this.isTouchScreenDevice && !active;
    const onClick = touchActive ? this.showMenu : this.displayPhase;
    return (
      <div
        ref={(segment) => {
          this.segment = segment;
        }}
        className={classNames('minimized-timeline', {
          active: active
        })}
        onMouseOver={!this.isTouchScreenDevice && this.showMenu}
        onMouseLeave={!this.isTouchScreenDevice && this.hideMenu}
      >
        {title.entries.filter(entry => locale === entry['@language']).map((entry, index) => (
          <div onClick={onClick} className={timelineClass} key={index}>
            {inProgress && <span className="arrow assembl-icon assembl-icon-right-dir" />}
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
            <div className="timeline-bar-background-container">
              &nbsp;
              <div className="timeline-bar-background" />
            </div>
          </div>
        </div>
        {!this.ignoreMenu && active && <span className="timeline-arrow" />}
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