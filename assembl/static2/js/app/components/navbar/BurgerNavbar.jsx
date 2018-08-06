// @flow

import * as React from 'react';
import classNames from 'classnames';

import Logo from './Logo';
import NavigationMenu from './navigationMenu';
import LanguageMenu from './languageMenu';
import { browserHistory } from '../../router';

type Props = {
  elements: React.Node,
  slug: string,
  logoSrc: string,
  logoLink: string,
  renderUserMenu: number => React.Node
};

type State = {
  shouldDisplayMenu: boolean
};

export default class BurgerNavbar extends React.PureComponent<Props, State> {
  unlisten: () => void;

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
    const { elements, slug, logoSrc, logoLink, renderUserMenu } = this.props;
    const { shouldDisplayMenu } = this.state;
    return (
      <div className="burger-navbar">
        {shouldDisplayMenu && (
          <div className="nav-burger-menu shown">
            <NavigationMenu elements={elements} />
            <LanguageMenu size="xl" className="burgermenu-language center" />
          </div>
        )}
        <span
          onClick={this.toggleMenu}
          className={classNames([`assembl-icon-${shouldDisplayMenu ? 'cancel' : 'menu-on'}`, 'burgermenu-icon', 'black'])}
        />
        <Logo slug={slug} src={logoSrc} url={logoLink} />
        <div className="right-part">{renderUserMenu(0)}</div>
      </div>
    );
  }
}