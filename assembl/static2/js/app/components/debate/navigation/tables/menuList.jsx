// @noflow
import * as React from 'react';
import classNames from 'classnames';

import MenuItem from '../menuItem';

export const menuScrollEventId = 'menu-scroll';

export type ItemNode = {
  id: string,
  parentId: string
};

type MenuListProps = {
  subMenu: boolean,
  items: Array<ItemNode>,
  rootItem: string,
  identifier: string,
  phaseId: string,
  className: string,
  onMenuItemClick: Function
};

type MenuListState = {
  selected: string
};

class MenuList extends React.Component<MenuListProps, MenuListState> {
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
    const { subMenu, items, rootItem, identifier, phaseId, className, onMenuItemClick } = this.props;
    const { selected } = this.state;
    // filter out item not having id (currently in table of thematics administration, but not saved yet)
    const rootItems = this.getItemChildren(rootItem).filter(item => item.id);
    if (rootItems.length === 0) return null;
    return (
      <React.Fragment>
        {subMenu ? <div className="sub-menu-separator" /> : null}
        <div className={classNames('menu-table-col', className, { 'sub-menu': subMenu })} onMouseLeave={this.onMenuleave}>
          <div className="menu-table">
            {rootItems.map(item => (
              <div>
                <MenuItem
                  key={item.id}
                  hasSubItems={items.some(listItem => listItem.parentId === item.id)}
                  selected={item.id === selected}
                  onClick={onMenuItemClick}
                  onMouseOver={this.onItemOver}
                  identifier={identifier}
                  phaseId={phaseId}
                  item={item}
                />
                {item.id === selected ? (
                  <MenuList
                    subMenu
                    onMenuItemClick={onMenuItemClick}
                    items={items}
                    rootItem={selected}
                    identifier={identifier}
                    phaseId={phaseId}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default MenuList;