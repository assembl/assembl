// @flow

import * as React from 'react';

import BurgerMenu from './burgerMenu';
import NavigationMenu from './navigationMenu';
import Logo from './Logo';
import LanguageMenu from './languageMenu';
import { browserHistory } from '../../router';

type Props = {
  elements: React.Node,
  logoLink: string,
  slug: string,
  logoSrc: string,
  renderUserMenu: number => React.Node,
  screenTooSmall: boolean
};

type State = {
  shouldDisplayMenu: boolean,
  activeSegment: -1
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
    const { elements, slug, logoLink, logoSrc, renderUserMenu, screenTooSmall } = this.props;
    return (
      <div className="flat-navbar">
        <div className="left-part">
          <BurgerMenu screenTooSmall={screenTooSmall}>
            <NavigationMenu elements={elements} />
            <LanguageMenu size="xs" className="navbar-language" />
          </BurgerMenu>
          <Logo slug={slug} src={logoSrc} url={logoLink} />
        </div>
        <div className="right-part-mobile">{renderUserMenu(0)}</div>
      </div>
    );
  }
}