// @flow
import * as React from 'react';
import classNames from 'classnames';

type Props = {
  id?: number,
  title: React.Node,
  className?: string,
  parents?: Array<number>,
  openedPath?: Array<number>,
  children?: React.Node,
  openedItem?: ?number,
  toggle: ?(id: number | void) => void
};

const MenuItem = ({ id, parents, title, toggle, className, openedItem, openedPath, children }: Props) => {
  const active = openedItem === id;
  const childrenElm = React.Children.map(children, (child) => {
    const indexes = [...(parents || []), id];
    return React.cloneElement(child, {
      parents: indexes,
      openedPath: openedPath,
      isSubMenu: true
    });
  });
  return (
    <li className={classNames(className, 'menu-item', { active: active })}>
      <div className="menu-item-title">
        {childrenElm ? (
          <span
            className={classNames({
              'assembl-icon-angle-down': active,
              'assembl-icon-angle-right': !active
            })}
            onClick={toggle ? () => toggle(id) : null}
          />
        ) : null}
        {title}
      </div>
      {active && childrenElm ? childrenElm : null}
    </li>
  );
};

MenuItem.defaultProps = {
  children: null,
  id: 0,
  parents: [],
  openedPath: [],
  openedItem: null,
  className: '',
  toggle: null
};

export default MenuItem;