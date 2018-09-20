// @flow
import * as React from 'react';

export type MenuItem = {
  title?: string,
  sectionId: string,
  component?: React.ComponentType<any>,
  subMenu?: {
    [key: string]: MenuItem
  }
};

export type Menu = {
  [key: string]: MenuItem
};

export function getAdminMenuSection(section: string, menu: Menu | null) {
  if (!menu) return null;
  const [index, ...subIndexes] = section.split('.');
  const item = menu[Object.keys(menu).filter(key => menu && menu[key].sectionId === index)[0]];
  const subMenu = item.subMenu;
  return subIndexes.length === 0 || !item ? item : getAdminMenuSection(subIndexes.join('.'), subMenu || null);
}