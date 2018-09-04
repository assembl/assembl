// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

import { get } from '../../utils/routeMap';
import { PHASES_ADMIN_MENU } from '../../constants';
import { type MenuItem } from '../../utils/administration/menu';

type Props = {
  index: number,
  isActive: boolean,
  slug: { slug: string | null },
  phase: Phase,
  locale: string
};

class PhaseMenu extends React.PureComponent<Props> {
  renderSubMenuItem = (menuItem: MenuItem, rootSectionId: string = '') => {
    const { phase, slug, locale } = this.props;
    const { sectionId, subMenu, title, component } = menuItem;
    if (component) {
      const MenuItemComponent = component;
      return <MenuItemComponent rootSectionId={rootSectionId} menuItem={menuItem} slug={slug} phase={phase} locale={locale} />;
    }
    const sectionIndex = rootSectionId ? `${rootSectionId}.${sectionId}` : sectionId;
    const sectionQuery = sectionId ? `?section=${sectionIndex}` : '';
    const subMenuIds = subMenu ? Object.keys(subMenu) : [];
    return (
      <li key={sectionId}>
        <Link
          to={`${get('administration', slug)}${get('adminPhase', {
            ...slug,
            phase: phase.identifier
          })}${sectionQuery}`}
          activeClassName="active"
        >
          <Translate value={title} />
        </Link>
        {subMenu && subMenuIds.length > 0 ? (
          <ul className="admin-sub-menu">{subMenuIds.map(subKey => this.renderSubMenuItem(subMenu[subKey], sectionQuery))}</ul>
        ) : null}
      </li>
    );
  };

  render() {
    const { index, isActive, slug, phase } = this.props;
    const menuItem = PHASES_ADMIN_MENU[phase.identifier];
    const { sectionId, subMenu } = menuItem;
    const sectionQuery = sectionId ? `?section=${sectionId}` : '';
    const subMenuIds = subMenu ? Object.keys(subMenu) : [];
    return (
      <li className="menu-item">
        <Link
          to={`${get('administration', slug)}${get('adminPhase', {
            ...slug,
            phase: phase.identifier
          })}${sectionQuery}`}
          activeClassName="active"
        >
          <Translate value="administration.menu.phase" count={index + 1} description={phase.title} />
        </Link>
        {subMenuIds.length > 0 ? (
          <ul className={isActive ? 'shown admin-menu2' : 'hidden admin-menu2'}>
            {subMenuIds.map(key => this.renderSubMenuItem(subMenu[key]))}
          </ul>
        ) : null}
      </li>
    );
  }
}
export default PhaseMenu;