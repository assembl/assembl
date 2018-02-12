// @flow
import React from 'react';
import classNames from 'classnames';

import MenuItem from '../menuItem';

export const menuScrollEventId = 'menu-scroll';

type MenuScrollEvent = {
  detail: { position: number }
};

export type ItemNode = {
  id: string,
  parentId: string
};

type MenuListProps = {
  items: Array<ItemNode>,
  rootItem: string,
  identifier: string,
  className: string,
  onMenuItemClick: Function,
  menuPosition: number
};

type MenuListState = {
  selected: string,
  position: number,
  menuPosition: number
};

class MenuList extends React.Component<*, MenuListProps, MenuListState> {
  props: MenuListProps;

  static defaultProps = {
    className: ''
  };

  constructor(props: MenuListProps) {
    super(props);
    const menuPosition = props.menuPosition || 0;
    this.state = {
      selected: '',
      position: menuPosition,
      menuPosition: menuPosition
    };
  }

  state = {
    selected: '',
    position: 0,
    menuPosition: 0
  };

  componentDidMount() {
    // the menuScrollEventId is triggered when the user scroll on the menu
    // see ./timelineSegment
    window.addEventListener(menuScrollEventId, this.handleMenuScroll);
  }

  componentWillReceiveProps(nexProps: MenuListProps) {
    // if it is not scrolling and not a new selection of a menu item
    // we must initialize the position of the submenu
    const { menuPosition } = nexProps;
    const { selected } = this.state;
    if (!selected && menuPosition === this.state.menuPosition) {
      this.setState({ position: menuPosition });
    }
  }

  componentWillUnmount() {
    window.removeEventListener(menuScrollEventId, this.handleMenuScroll);
  }

  onItemOver = (itemId: string) => {
    this.setState({ selected: itemId });
  };

  onMenuleave = () => {
    this.setState({ selected: '' });
  };

  getItemChildren = (itemId: string) => {
    const { items } = this.props;
    if (items) {
      return itemId ? items.filter(item => item.parentId === itemId) : items;
    }
    return [];
  };

  handleMenuScroll = (event: SyntheticEvent & MenuScrollEvent) => {
    const menuPosition = event.detail.position;
    const { position } = this.state;
    // update the menu table position only if it's greater than the menu position
    const newPosition = position > menuPosition ? menuPosition : position;
    this.setState({ menuPosition: menuPosition, position: newPosition });
  };

  render() {
    const { items, rootItem, identifier, className, onMenuItemClick } = this.props;
    const { selected, position, menuPosition } = this.state;
    const rootItems = this.getItemChildren(rootItem);
    if (rootItems.length === 0) return null;
    return (
      <div className={classNames('menu-table-col', className)} onMouseLeave={this.onMenuleave}>
        <div className="menu-table" style={{ paddingTop: position }}>
          {rootItems.map(item => (
            <MenuItem
              key={item.id}
              hasSubItems={items.some(listItem => listItem.parentId === item.id)}
              selected={item.id === selected}
              onClick={onMenuItemClick}
              onMouseOver={this.onItemOver}
              identifier={identifier}
              item={item}
            />
          ))}
        </div>
        {selected && (
          <MenuList
            onMenuItemClick={onMenuItemClick}
            className="sub-menu"
            items={items}
            rootItem={selected}
            identifier={identifier}
            menuPosition={menuPosition}
          />
        )}
      </div>
    );
  }
}

export default MenuList;