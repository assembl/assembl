// @flow
import * as React from 'react';
import classNames from 'classnames';

type Props = {
  children: React.Node,
  className?: string,
  parents?: Array<number>,
  openedPath?: Array<number>,
  isSubMenu?: boolean
};

type State = {
  openedItem: ?number
};

class Menu extends React.Component<Props, State> {
  static defaultProps = {
    isSubMenu: false,
    parents: [],
    openedPath: [],
    className: ''
  };

  static getDerivedStateFromProps(props: Props) {
    const { openedPath } = props;
    return {
      openedItem: openedPath ? openedPath[0] : null
    };
  }

  state = {
    openedItem: null
  };

  toggleMenuItem = (id: number) => {
    this.setState(prevState => ({ openedItem: prevState.openedItem !== id ? id : null }));
  };

  render() {
    const { className, isSubMenu, parents, openedPath, children } = this.props;
    const { openedItem } = this.state;
    const childrenElm = React.Children.map(children, (child, index) => {
      const spreadPath = openedItem !== null && openedPath && openedPath[0] === openedItem;
      return React.cloneElement(child, {
        openedPath: spreadPath && openedPath && openedPath.slice(1),
        parents: parents,
        id: index,
        openedItem: openedItem,
        toggle: this.toggleMenuItem
      });
    });
    return <ul className={classNames(className, { menu: !isSubMenu, 'sub-menu': isSubMenu })}>{childrenElm}</ul>;
  }
}

export default Menu;