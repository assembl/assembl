// @flow

import * as React from 'react';
import classNames from 'classnames';

import TimelineCpt from '../debate/navigation/timeline';
import { browserHistory } from '../../router';

type Props = {
  timeline: Object
};

type State = {
  shouldDisplayMenu: boolean,
  activeSegment: -1
};

class BurgerNavbar extends React.PureComponent<Props, State> {
  unlisten: () => void;

  componentWillMount() {
    this.setState({ shouldDisplayMenu: false });
    this.unlisten = browserHistory.listen(() => {
      this.setState({ shouldDisplayMenu: false });
    });
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    this.unlisten();
  }

  showMenu = () => {
    this.setState({ shouldDisplayMenu: true });
  };

  hideMenu = () => {
    this.setState({ shouldDisplayMenu: false, activeSegment: -1 });
  };

  handleClickOutside = (event: MouseEvent) => {
    // Cannot call `this.debateNode.contains` with `event.target` bound to `other`
    // because `EventTarget` [1] is incompatible with `Node`
    // $FlowFixMe
    if (this.state.timeLineActive && this.debateNode && !this.debateNode.contains(event.target)) {
      this.hideMenu();
    }
  };

  showSegmentMenu = (index: number) => {
    this.setState((prevState) => {
      const newIndex = prevState.activeSegment !== index ? index : -1;
      return {
        activeSegment: newIndex
      };
    });
  };

  toggleMenu = () => {
    this.setState(prevState => ({
      shouldDisplayMenu: !prevState.shouldDisplayMenu
    }));
  };

  render() {
    const { timeline, identifier } = this.props;
    const { shouldDisplayMenu, activeSegment } = this.state;
    const activeSegmentPhase = timeline ? timeline[activeSegment] : undefined;
    return (
      <div
        ref={(debateNode) => {
          this.debateNode = debateNode;
        }}
        className="burger-navbar"
      >
        {shouldDisplayMenu && (
          <div className="nav-burger-menu">
            <TimelineCpt
              identifier={identifier}
              timeline={timeline}
              activeSegment={activeSegment}
              showSegmentMenu={this.showSegmentMenu}
              onItemDeselect={this.hideMenu}
              activeSegmentPhase={activeSegmentPhase}
              showNavigation
            />
          </div>
        )}
        <div onClick={this.toggleMenu} className="nav-burger-with-text">
          <span
            className={classNames([`assembl-icon-${shouldDisplayMenu ? 'cancel' : 'menu-on'}`, 'burgermenu-icon', 'black'])}
          />
          <span className="menu-text">menu</span>
        </div>
      </div>
    );
  }
}

export default BurgerNavbar;