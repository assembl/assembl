// @noflow
import * as React from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';

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

const menuItemHeight = 52;

const menuItemMargin = 10;

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
    const rootItems = this.getItemChildren(rootItem);
    if (rootItems.length === 0) return null;
    const estimatedMenuHeight = rootItems.length * menuItemHeight + menuItemMargin;
    return [
      subMenu ? <div key="separator" className="sub-menu-separator" /> : '',
      <div
        key="submenu"
        className={classNames('menu-table-col', className, { 'sub-menu': subMenu })}
        onMouseLeave={this.onMenuleave}
      >
        <div className="menu-table" style={{ height: `${estimatedMenuHeight}px` }}>
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
                phaseId={phaseId}
                item={item}
              />
            ))}
          </Scrollbars>
        </div>
        {selected && (
          <MenuList
            subMenu
            onMenuItemClick={onMenuItemClick}
            items={items}
            rootItem={selected}
            identifier={identifier}
            phaseId={phaseId}
          />
        )}
      </div>
    ];
  }
}

export default MenuList;