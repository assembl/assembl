// @flow
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

import Timeline from '../navigation/timeline';

type DebateLinkProps = {
  identifier: string,
  className: string,
  activeClassName: string,
  children: Array<*>,
  to: string,
  dataText: string
};

type DebateLinkState = {
  menuActive: boolean
};

class DebateLink extends React.Component<*, DebateLinkProps, DebateLinkState> {
  state = {
    menuActive: false
  };

  showMenu = () => {
    this.setState({ menuActive: true });
  };

  hideMenu = () => {
    this.setState({ menuActive: false });
  };

  render() {
    const { identifier, children, to, className, activeClassName, dataText } = this.props;
    const { menuActive } = this.state;
    return (
      <div className={classNames('debate-link', { active: menuActive })} onMouseOver={this.showMenu} onMouseLeave={this.hideMenu}>
        <Link to={to} className={className} activeClassName={activeClassName} data-text={dataText}>
          {children}
        </Link>
        <div className="header-container">
          <section className="timeline-section" id="timeline">
            <div className="max-container">
              <Timeline showNavigation identifier={identifier} onMenuItemClick={this.hideMenu} />
            </div>
          </section>
        </div>
      </div>
    );
  }
}

export default DebateLink;