// @flow
import React from 'react';

import Logo from './Logo';
import NavigationMenu from './navigationMenu';
import LanguageMenu, { refWidthUpdate } from './languageMenu';
import UserMenu from './UserMenu';

export default class FlatNavbar extends React.PureComponent {
  state: {
    leftWidth: number,
    rightWidth: number,
    languageMenuWidth: number
  };

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
    const {
      elements,
      slug,
      logoSrc,
      connectedUserId,
      currentPhaseIdentifier,
      helpUrl,
      location,
      style,
      logoLink,
      maxWidth,
      themeId,
      isLargeLogo,
      loginData
    } = this.props;
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
          <UserMenu
            helpUrl={helpUrl}
            location={location}
            connectedUserId={connectedUserId}
            currentPhaseIdentifier={currentPhaseIdentifier}
            remainingWidth={maxWidth - this.state.leftWidth + this.state.languageMenuWidth}
            themeId={themeId}
            loginData={loginData}
          />
          <LanguageMenu size="xs" className="navbar-language" setWidth={this.setLanguageMenuWidth} />
        </div>
      </div>
    );
  };
}