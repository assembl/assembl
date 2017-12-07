// @flow

import React from 'react';

import Logo from './Logo';
import NavigationMenu from './navigationMenu';
import LanguageMenu from './languageMenu';
import UserMenu from './UserMenu';

const refWidthUpdate = setWidth => (ref) => {
  if (ref) setWidth(ref.getBoundingClientRect().width);
};

export default class FlatNavbar extends React.PureComponent {
  state: {
    leftWidth: number,
    rightWidth: number
  };

  static defaultProps = {
    style: {}
  };

  updateWidth = () => {
    const { leftWidth = 0, rightWidth = 0 } = this.state;
    const margin = 50;
    this.props.setWidth(leftWidth + rightWidth + margin);
  };

  render = () => {
    const { elements, slug, logoSrc, connectedUserId, currentPhaseIdentifier, helpUrl, location, style, logoLink } = this.props;
    return (
      <div className="flat-navbar" style={style}>
        <div
          className="left-part"
          ref={refWidthUpdate((newWidth) => {
            this.setState({ leftWidth: newWidth }, this.updateWidth);
          })}
        >
          <Logo slug={slug} src={logoSrc} url={logoLink} />
          <NavigationMenu elements={elements} />
        </div>
        <div
          className="right-part"
          ref={refWidthUpdate((newWidth) => {
            this.setState({ rightWidth: newWidth }, this.updateWidth);
          })}
        >
          <UserMenu
            helpUrl={helpUrl}
            location={location}
            connectedUserId={connectedUserId}
            currentPhaseIdentifier={currentPhaseIdentifier}
          />
          <LanguageMenu size="xs" className="navbar-language" />
        </div>
      </div>
    );
  };
}