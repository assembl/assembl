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
    if (this.debate && !this.debate.contains(event.target)) {
      this.hideMenu();
    }
  };

  render() {
    const { identifier, children, to, className, activeClassName, dataText, screenTooSmall } = this.props;
    const { menuActive } = this.state;
    return (
      <div
        ref={(debate) => {
          this.debate = debate;
        }}
        className={classNames('debate-link', { active: menuActive })}
        onMouseOver={!screenTooSmall && this.showMenu}
        onMouseLeave={!screenTooSmall && this.hideMenu}
      >
        <Link to={to} className={className} activeClassName={activeClassName} data-text={dataText}>
          {children}
        </Link>
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