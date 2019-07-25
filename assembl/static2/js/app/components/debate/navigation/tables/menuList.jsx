// @noflow
import * as React from 'react';
import classNames from 'classnames';

import MenuItem from '../menuItem';
import { browserHistory } from '../../../../router';

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

  componentDidMount() {
    this.preOpenMenuItems();
  }

  preOpenMenuItems = () => {
    const { items, rootItem } = this.props;
    const pathname = browserHistory.getCurrentLocation().pathname;
    const thematicIdFromPathname = pathname.split('/')[5];
    const MenuItemFromThematicId = items.find(element => element.id === thematicIdFromPathname);
    const rootItems = this.getItemChildren(rootItem).filter(item => item.id);
    rootItems.forEach((item) => {
      if (MenuItemFromThematicId && MenuItemFromThematicId.ancestors.includes(item.id)) {
        this.setState(() => ({
          selected: item.id
        })); // filter out item not having id (currently in table of thematics administration, but not saved yet)
      }
    });
  };

  toggleMenu = (itemId) => {
    this.setState((prevState) => {
      const newId = prevState.selected !== itemId ? itemId : '';
      return {
        selected: newId
      };
    });
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
    const pathname = browserHistory.getCurrentLocation().pathname;
    const pathnameThemeId = pathname.split('/')[5];
    // filter out item not having id (currently in table of thematics administration, but not saved yet)
    const rootItems = this.getItemChildren(rootItem).filter(item => item.id);
    if (rootItems.length === 0) return null;
    return (
      <React.Fragment>
        {subMenu ? <div className="sub-menu-separator" /> : null}
        <div
          className={classNames('menu-table-col', className, {
            'sub-menu': subMenu
          })}
        >
          <div className="menu-table">
            {rootItems.map(item => (
              <div key={item.id}>
                <MenuItem
                  hasSubItems={items.some(listItem => listItem.parentId === item.id)}
                  selected={item.id === selected}
                  preSelect={item.id === pathnameThemeId}
                  onClick={onMenuItemClick}
                  toggleMenu={this.toggleMenu}
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