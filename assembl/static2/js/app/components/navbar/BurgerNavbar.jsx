// @flow

import * as React from 'react';
import classNames from 'classnames';

import { browserHistory } from '../../router';

type Props = {
  timeline: Object
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
    const { timeline } = this.props;
    const { shouldDisplayMenu } = this.state;
    return (
      <div className="burger-navbar">
        {shouldDisplayMenu && <div className="nav-burger-menu">{timeline.map((phase, index) => <p key={index}>lala</p>)}</div>}
        <div className="nav-burger-with-text">
          <span
            onClick={this.toggleMenu}
            className={classNames([`assembl-icon-${shouldDisplayMenu ? 'cancel' : 'menu-on'}`, 'burgermenu-icon', 'black'])}
          />
          <span className="menu-text">menu</span>
        </div>
      </div>
    );
  }
}