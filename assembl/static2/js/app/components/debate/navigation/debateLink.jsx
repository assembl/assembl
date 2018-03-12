// @flow
import React from 'react';
import classNames from 'classnames';

import Timeline from '../navigation/timeline';
import { isMobile } from '../../../utils/globalFunctions';
import { goTo } from '../../../utils/routeMap';

type DebateLinkProps = {
  identifier: string,
  className: string,
  activeClassName: string,
  children: Array<*>,
  to: string,
  dataText: string,
  screenTooSmall: boolean
};

type DebateLinkState = {
  menuActive: boolean
};

class DebateLink extends React.Component<*, DebateLinkProps, DebateLinkState> {
  state = {
    menuActive: false
  };

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  debate = null;

  showMenu = () => {
    this.setState({ menuActive: true });
  };

  hideMenu = () => {
    this.setState({ menuActive: false });
  };

  handleClickOutside = (event: MouseEvent) => {
    if (this.state.menuActive && this.debate && !this.debate.contains(event.target)) {
      this.hideMenu();
    }
  };

  onLinkClick = () => {
    this.hideMenu();
    goTo(this.props.to);
  };

  render() {
    const { identifier, children, to, className, activeClassName, dataText, screenTooSmall } = this.props;
    const { menuActive } = this.state;
    // The first touch show the menu and the second activate the link
    const isTouchScreenDevice = isMobile.any();
    const touchActive = isTouchScreenDevice && !menuActive;
    const onLinkClick = touchActive ? this.showMenu : this.onLinkClick;
    const linkActive = window.location.pathname === to;
    return (
      <div
        ref={(debate) => {
          this.debate = debate;
        }}
        className={classNames('debate-link', { active: menuActive })}
        onMouseOver={!isTouchScreenDevice && !screenTooSmall && this.showMenu}
        onMouseLeave={!isTouchScreenDevice && !screenTooSmall && this.hideMenu}
      >
        <div onClick={onLinkClick} className={classNames(className, { [activeClassName]: linkActive })} data-text={dataText}>
          {children}
        </div>
        {!screenTooSmall && (
          <div className="header-container">
            <section className="timeline-section" id="timeline">
              <div className="max-container">
                <Timeline showNavigation identifier={identifier} onMenuItemClick={this.hideMenu} />
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }
}

export default DebateLink;