// @flow

import React from 'react';
import { browserHistory } from 'react-router';
import classNames from 'classnames';

import Logo from './Logo';
import NavigationMenu from './navigationMenu';
import LanguageMenu from './languageMenu';
import UserMenu from './UserMenu';

export default class BurgerNavbar extends React.PureComponent {
  unlisten: () => void;

  state: {
    shouldDisplayMenu: boolean
  };

  componentWillMount() {
    this.setState({ shouldDisplayMenu: false });
    this.unlisten = browserHistory.listen(() => {
      this.setState({ shouldDisplayMenu: false });
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  toggleMenu = () => {
    this.setState(prevState => ({
      shouldDisplayMenu: !prevState.shouldDisplayMenu
    }));
  };

  render() {
    const { state, props, toggleMenu } = this;
    const { elements, slug, logoSrc, connectedUserId, currentPhaseIdentifier, helpUrl, location, logoLink } = props;
    const { shouldDisplayMenu } = state;
    return (
      <div className="burger-navbar">
        {shouldDisplayMenu && (
          <div className="nav-burger-menu shown">
            <NavigationMenu elements={elements} />
            <LanguageMenu size="xl" className="burgermenu-language center" />
          </div>
        )}
        <span
          onClick={toggleMenu}
          className={classNames([`assembl-icon-${shouldDisplayMenu ? 'cancel' : 'menu-on'}`, 'burgermenu-icon', 'black'])}
        />
        <Logo slug={slug} src={logoSrc} url={logoLink} />
        <div className="right-part">
          <UserMenu
            helpUrl={helpUrl}
            location={location}
            connectedUserId={connectedUserId}
            currentPhaseIdentifier={currentPhaseIdentifier}
          />
        </div>
      </div>
    );
  }
}