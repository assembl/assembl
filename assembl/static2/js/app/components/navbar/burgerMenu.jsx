// @flow

import * as React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TimelineCpt from '../debate/navigation/timeline';
import { browserHistory } from '../../router';
import { getCurrentPhaseData } from '../../utils/timeline';

type Props = {
  children: React.Node,
  timeline: Object,
  screenTooSmall: Boolean
};

type State = {
  shouldDisplayMenu: boolean,
  activeSegment: number
};

export class BurgerMenu extends React.PureComponent<Props, State> {
  unlisten: () => void;

  componentWillMount() {
    document.removeEventListener('click', this.handleClickOutside);
    this.setState({ shouldDisplayMenu: false });
    this.unlisten = browserHistory.listen(() => {
      this.setState({ shouldDisplayMenu: false });
    });
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    this.unlisten();
  }

  burgerMenuNode = null;

  handleClickOutside = (event: MouseEvent) => {
    // Cannot call `this.debateNode.contains` with `event.target` bound to `other`
    // because `EventTarget` [1] is incompatible with `Node`
    // $FlowFixMe
    if (
      this.state.shouldDisplayMenu &&
      this.burgerMenuNode &&
      !this.burgerMenuNode.contains(event.target)
    ) {
      this.hideMenu();
    }
  };

  toggleMenu = () => {
    const { timeline } = this.props;
    const pathname = browserHistory.getCurrentLocation().pathname;
    const pathnameIdentifier = pathname.split('/')[3];
    const isTheIdentifier = element =>
      element.identifier === pathnameIdentifier;
    this.setState(prevState => ({
      shouldDisplayMenu: !prevState.shouldDisplayMenu,
      activeSegment: pathnameIdentifier
        ? timeline.findIndex(isTheIdentifier)
        : -1
    }));
  };

  showSegmentMenu = (index: number) => {
    this.setState((prevState) => {
      const newIndex = prevState.activeSegment !== index ? index : -1;
      return {
        activeSegment: newIndex
      };
    });
  };

  hideMenu = () => {
    this.setState({ shouldDisplayMenu: false, activeSegment: -1 });
  };

  render() {
    const { children, timeline, screenTooSmall } = this.props;
    const { shouldDisplayMenu, activeSegment } = this.state;
    const activeSegmentPhase = timeline ? timeline[activeSegment] : undefined;
    const { currentPhaseIdentifier } = getCurrentPhaseData(timeline);
    // const isTouchScreenDevice = isMobile.any();
    return (
      <div
        id="burger-menu"
        ref={(burgerMenuNode) => {
          this.burgerMenuNode = burgerMenuNode;
        }}
      >
        {shouldDisplayMenu && (
          <div
            id={screenTooSmall ? 'screen-too-small' : ''}
            className="nav-burger-menu shown"
          >
            <TimelineCpt
              identifier={currentPhaseIdentifier}
              timeline={timeline}
              activeSegment={activeSegment}
              showSegmentMenu={this.showSegmentMenu}
              hideMenu={this.hideMenu}
              activeSegmentPhase={activeSegmentPhase}
              showNavigation
            />
            {children}
          </div>
        )}
        <span onClick={this.toggleMenu} className="nav-burger-with-text">
          <span
            className={classNames([
              `assembl-icon-${shouldDisplayMenu ? 'cancel' : 'menu-on'}`,
              'burgermenu-icon',
              'black'
            ])}
          />
          <span className="menu-text">{I18n.t('navbar.theme')}</span>
        </span>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  timeline: state.timeline
});

export default connect(mapStateToProps)(BurgerMenu);