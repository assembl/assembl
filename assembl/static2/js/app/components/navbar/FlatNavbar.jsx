// @flow
import * as React from 'react';

import Logo from './Logo';
import NavigationMenu from './navigationMenu';
import LanguageMenu, { refWidthUpdate } from './languageMenu';

type Props = {
  elements: React.Node,
  slug: string,
  logoSrc: string,
  style: Object,
  logoLink: string,
  maxWidth: number,
  isLargeLogo: boolean,
  setWidth: number => void,
  renderUserMenu: number => React.Node
};

type State = {
  leftWidth: number,
  rightWidth: number,
  languageMenuWidth: number
};

export default class FlatNavbar extends React.PureComponent<Props, State> {
  static defaultProps = {
    style: {}
  };

  state = {
    leftWidth: 0,
    rightWidth: 0,
    languageMenuWidth: 0
  };

  updateWidth = () => {
    const { leftWidth, rightWidth } = this.state;
    const margin = 10;
    this.props.setWidth(leftWidth + rightWidth + margin);
  };

  setLanguageMenuWidth = (width: number) => this.setState(() => ({ languageMenuWidth: width }));

  render = () => {
    const { elements, slug, logoSrc, style, logoLink, maxWidth, isLargeLogo, renderUserMenu } = this.props;
    const remainingWidth = maxWidth - this.state.leftWidth + this.state.languageMenuWidth;
    return (
      <div className="flat-navbar" style={style}>
        <div
          className="left-part"
          ref={refWidthUpdate(newWidth => this.setState(() => ({ leftWidth: newWidth }), this.updateWidth))}
        >
          {!isLargeLogo && <Logo slug={slug} src={logoSrc} url={logoLink} />}
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