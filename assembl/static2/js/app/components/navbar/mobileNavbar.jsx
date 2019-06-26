// @flow

import * as React from 'react';

import { browserHistory } from '../../router';

type Props = {
  renderUserMenu: number => React.Node
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
    const { renderUserMenu } = this.props;
    const { shouldDisplayMenu } = this.state;
    return (
      <div className="mobile-navbar">
        {shouldDisplayMenu && <div className="nav-burger-menu shown" />}
        <div className="right-part">{renderUserMenu(0)}</div>
      </div>
    );
  }
}