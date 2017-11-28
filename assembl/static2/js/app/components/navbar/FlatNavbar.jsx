import React from 'react';

import Logo from './Logo';
import NavigationMenu from './navigationMenu';
import LanguageMenu from './languageMenu';
import UserMenu from './UserMenu';

const refWidthUpdate = (setWidth) => {
  return (ref) => {
    if (ref) setWidth(ref.getBoundingClientRect().width);
  };
};

export default class FlatNavbar extends React.PureComponent {
  updateWidth = () => {
    const { leftWidth = 0, rightWidth = 0 } = this.state;
    this.props.setWidth(leftWidth + rightWidth);
  };
  render = () => {
    const { elements, slug, logoSrc, connectedUserId, currentPhaseIdentifier, helpUrl, location, style } = this.props;
    return (
      <div className="flat-navbar" style={style || {}}>
        <div
          className="left-part"
          ref={refWidthUpdate((newWidth) => {
            this.setState({ leftWidth: newWidth }, this.updateWidth);
          })}
        >
          <Logo slug={slug} src={logoSrc} />
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