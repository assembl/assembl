// @flow
import * as React from 'react';
import debounce from 'lodash/debounce';

import BurgerMenu from './burgerMenu';
import NavigationMenu from './navigationMenu';
import LanguageMenu, { refWidthUpdate } from './languageMenu';
import Logo from './Logo';

type Props = {
  elements: React.Node,
  logoLink: string,
  slug: string,
  logoSrc: string,
  style: Object,
  maxWidth: number,
  setWidth: number => void,
  renderUserMenu: number => React.Node
};

type State = {
  leftWidth: number,
  rightWidth: number,
  languageMenuWidth: number
};

export default class DesktopNavbar extends React.PureComponent<Props, State> {
  static defaultProps = {
    style: {}
  };

  state = {
    leftWidth: 0,
    rightWidth: 0,
    languageMenuWidth: 0
  };

  updateWidth = debounce(() => {
    const { leftWidth, rightWidth } = this.state;
    const margin = 10;
    // This setWidth may trigger a render loop, this is why we use debounce here.
    // Uncaught Error: Maximum update depth exceeded. This can happen when a component
    // repeatedly calls setState inside componentWillUpdate or componentDidUpdate.
    // React limits the number of nested updates to prevent infinite loops.
    this.props.setWidth(leftWidth + rightWidth + margin);
  }, 200);

  setLanguageMenuWidth = (width: number) => this.setState(() => ({ languageMenuWidth: width }));

  render = () => {
    const { elements, slug, logoLink, logoSrc, style, maxWidth, renderUserMenu } = this.props;
    const remainingWidth = maxWidth - this.state.leftWidth + this.state.languageMenuWidth;
    return (
      <div className="flat-navbar" style={style}>
        <div
          className="left-part"
          ref={refWidthUpdate(newWidth => this.setState(() => ({ leftWidth: newWidth }), this.updateWidth))}
        >
          <BurgerMenu />
          <Logo slug={slug} src={logoSrc} url={logoLink} />
          <NavigationMenu elements={elements} />
        </div>
        <div
          className="right-part"
          ref={refWidthUpdate(newWidth => this.setState(() => ({ rightWidth: newWidth }), this.updateWidth))}
        >
          {renderUserMenu(remainingWidth)}
          <LanguageMenu size="xs" className="navbar-language" setWidth={this.setLanguageMenuWidth} />
        </div>
      </div>
    );
  };
}