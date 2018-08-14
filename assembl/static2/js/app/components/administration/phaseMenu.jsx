// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';

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
      return (
        <MenuItemComponent
          key={phase.id + sectionId}
          rootSectionId={rootSectionId}
          menuItem={menuItem}
          slug={slug}
          phase={phase}
          locale={locale}
        />
      );
    }
    const sectionIndex = rootSectionId ? `${rootSectionId}.${sectionId}` : sectionId;
    const query = { phaseId: phase.id };
    const sectionQuery = sectionIndex ? { section: sectionIndex, ...query } : query;
    const subMenuIds = subMenu ? Object.keys(subMenu) : [];
    return (
      <li key={phase.id + sectionId}>
        <Link to={`${get('administration', { ...slug, id: phase.identifier }, sectionQuery)}`} activeClassName="active">
          <Translate value={title} />
        </Link>
        {subMenu && subMenuIds.length > 0 ? (
          <ul className="admin-sub-menu">{subMenuIds.map(subKey => this.renderSubMenuItem(subMenu[subKey], sectionIndex))}</ul>
        ) : null}
      </li>
    );
  };

  render() {
    const { index, isActive, slug, phase } = this.props;
    const menuItem = PHASES_ADMIN_MENU[phase.identifier];
    const { sectionId, subMenu } = menuItem;
    const query = { phaseId: phase.id };
    const sectionQuery = sectionId ? { section: sectionId, ...query } : query;
    const subMenuIds = subMenu ? Object.keys(subMenu) : [];
    return (
      <li className="menu-item">
        <Link to={`${get('administration', { ...slug, id: phase.identifier }, sectionQuery)}`} activeClassName="active">
          <Translate value="administration.menu.phase" count={index + 1} description={phase.title} />
        </Link>
        {subMenuIds.length > 0 ? (
          <ul className={classNames('admin-menu2', { shown: isActive, hidden: !isActive })}>
            {subMenuIds.map(key => this.renderSubMenuItem(subMenu[key]))}
          </ul>
        ) : null}
      </li>
    );
  }
}
export default PhaseMenu;