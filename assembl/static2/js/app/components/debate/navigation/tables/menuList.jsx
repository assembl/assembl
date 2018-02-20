// @flow
import React from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

import MenuItem from '../menuItem';

export const menuScrollEventId = 'menu-scroll';

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

  render() {
    const { items, rootItem, identifier, className, onMenuItemClick } = this.props;
    const { selected } = this.state;
    const rootItems = this.getItemChildren(rootItem);
    if (rootItems.length === 0) return null;
    return (
      <div className={classNames('menu-table-col', className)} onMouseLeave={this.onMenuleave}>
        <div className="menu-table">
          <Scrollbars
            // we hide the scrollbar
            renderTrackVertical={props => <div {...props} className="hidden" />}
            renderThumbVertical={props => <div {...props} className="hidden" />}
          >
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
          </Scrollbars>
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