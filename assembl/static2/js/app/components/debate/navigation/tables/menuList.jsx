// @flow
import React from 'react';
import classNames from 'classnames';

import MenuItem from '../menuItem';

export type ItemNode = {
  id: string,
  parentId: string
};

type MenuListProps = {
  items: Array<ItemNode>,
  rootItem: string,
  identifier: string,
  className: string,
  onMenuItemClick: Function
};

type MenuListState = {
  selected: string
};

class MenuList extends React.Component<*, MenuListProps, MenuListState> {
  props: MenuListProps;

  static defaultProps = {
    className: ''
  };

  state = {
    selected: ''
  };

  componentWillReceiveProps() {
    if (this.state.selected) {
      this.setState({ selected: '' });
    }
  }

  onItemOver = (itemId: string) => {
    this.setState({ selected: itemId });
  };

  getItemChildren = (itemId: string) => {
    const { items } = this.props;
    if (items) {
      return itemId ? items.filter(item => item.parentId === itemId) : items;
    }
    return [];
  };

  render() {
    const { items, rootItem, identifier, className, onMenuItemClick } = this.props;
    const { selected } = this.state;
    const rootItems = this.getItemChildren(rootItem);
    if (rootItems.length === 0) return null;
    return (
      <div className={classNames('menu-table-col', className)}>
        <div className="menu-table">
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
          />
        )}
      </div>
    );
  }
}

export default MenuList;