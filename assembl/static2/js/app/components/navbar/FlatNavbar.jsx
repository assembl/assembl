// @flow

import React from 'react';
import lodashGet from 'lodash/get';

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

  updateWidth = () => {
    const { leftWidth = 0, rightWidth = 0 } = this.state;
    const margin = 10;
    this.props.setWidth(leftWidth + rightWidth + margin);
  };

  setLanguageMenuWidth = (width: number) => this.setState({ languageMenuWidth: width });

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
      themeId
    } = this.props;
    return (
      <div className="flat-navbar" style={style}>
        <div className="left-part" ref={refWidthUpdate(newWidth => this.setState({ leftWidth: newWidth }, this.updateWidth))}>
          <Logo slug={slug} src={logoSrc} url={logoLink} />
          <NavigationMenu elements={elements} />
        </div>
        <div className="right-part" ref={refWidthUpdate(newWidth => this.setState({ rightWidth: newWidth }, this.updateWidth))}>
          <UserMenu
            helpUrl={helpUrl}
            location={location}
            connectedUserId={connectedUserId}
            currentPhaseIdentifier={currentPhaseIdentifier}
            remainingWidth={maxWidth - (lodashGet(this, 'state.leftWidth', 0) + lodashGet(this, 'state.languageMenuWidth', 0))}
            themeId={themeId}
          />
          <LanguageMenu size="xs" className="navbar-language" setWidth={this.setLanguageMenuWidth} />
        </div>
      </div>
    );
  };
}