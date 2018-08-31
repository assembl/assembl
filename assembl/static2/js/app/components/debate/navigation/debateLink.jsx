// @flow
import * as React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import TimelineCpt from './timeline';
import TimelineSegmentMenu from './timelineSegmentMenu';
import { isMobile } from '../../../utils/globalFunctions';

type DebateLinkProps = {
  timeline: Timeline,
  identifier: string,
  className: string,
  activeClassName: string,
  children: React.Node,
  dataText: string,
  screenTooSmall: boolean
};

type DebateLinkState = {
  timeLineActive: boolean,
  activeSegment: number
};

export class DumbDebateLink extends React.Component<DebateLinkProps, DebateLinkState> {
  state = {
    timeLineActive: false,
    activeSegment: -1
  };

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  debateNode = null;

  showMenu = () => {
    this.setState({ timeLineActive: true });
  };

  hideMenu = () => {
    this.setState({ timeLineActive: false, activeSegment: -1 });
  };

  handleClickOutside = (event: MouseEvent) => {
    // Cannot call `this.debateNode.contains` with `event.target` bound to `other`
    // because `EventTarget` [1] is incompatible with `Node`
    // $FlowFixMe
    if (this.state.timeLineActive && this.debateNode && !this.debateNode.contains(event.target)) {
      this.hideMenu();
    }
  };

  showSegmentMenu = (index: number) => {
    this.setState({ activeSegment: index });
  };

  render() {
    const { identifier, children, className, activeClassName, dataText, screenTooSmall, timeline } = this.props;
    const { timeLineActive, activeSegment } = this.state;
    // timeline can still be null (loading) if Sections query returned before Timeline query
    const activeSegmentPhase = timeline ? timeline[activeSegment] : undefined;
    // The first touch show the menu and the second activate the link
    const isTouchScreenDevice = isMobile.any();
    return (
      <div
        ref={(debateNode) => {
          this.debateNode = debateNode;
        }}
        className={classNames('debate-link', { active: timeLineActive })}
        onMouseOver={!isTouchScreenDevice && !screenTooSmall ? this.showMenu : null}
        onMouseLeave={!isTouchScreenDevice && !screenTooSmall ? this.hideMenu : null}
      >
        <div className={classNames(className, activeClassName)} data-text={dataText}>
          {children}
        </div>
        {!screenTooSmall && (
          <div className="header-container">
            <section className="timeline-section" id="timeline">
              <div className="max-container">
                <TimelineCpt
                  timeline={timeline}
                  activeSegment={activeSegment}
                  showNavigation
                  identifier={identifier}
                  onItemSelect={this.showSegmentMenu}
                  onItemDeselect={this.hideMenu}
                />
              </div>
            </section>
            {activeSegmentPhase && (
              <TimelineSegmentMenu
                phaseIdentifier={activeSegmentPhase.identifier}
                title={activeSegmentPhase.title}
                onMenuItemClick={this.hideMenu}
                startDate={activeSegmentPhase.start}
                endDate={activeSegmentPhase.end}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline
});

export default connect(mapStateToProps)(DumbDebateLink);