import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

import { get } from '../../utils/routeMap';
import { PHASES_ADMIN_MENU } from '../../constants';

class PhaseMenu extends React.Component {
  renderMenuItem = (menuItem) => {
    const { phase, slug, locale } = this.props;
    const { sectionId, subMenu, title, component } = menuItem;
    if (component) {
      const MenuItemComponent = component;
      return (
        <ul key={sectionId} className="shown admin-menu2">
          <MenuItemComponent section={menuItem} slug={slug} phase={phase} locale={locale} />
        </ul>
      );
    }
    const sectionQuery = sectionId ? `?section=${sectionId}` : '';
    return (
      <li key={sectionId}>
        <Link
          to={`${get('administration', slug)}${get('adminPhase', {
            ...slug,
            phase: phase.identifier
          })}?section=${sectionQuery}`}
          activeClassName="active"
        >
          <Translate value={title} />
        </Link>
        {subMenu ? (
          <ul className="shown admin-menu2">
            {Object.keys(subMenu).map((subKey) => {
              const subMenuItem = subMenu[subKey];
              return this.renderMenuItem(subMenuItem);
            })}
          </ul>
        ) : null}
      </li>
    );
  };

  render() {
    const { index, isActive, slug, phase } = this.props;
    const menuItem = PHASES_ADMIN_MENU[phase.identifier];
    const { sectionId, subMenu } = menuItem;
    const sectionQuery = sectionId ? `?section=${sectionId}` : '';
    return (
      <li className="menu-item">
        <Link
          to={`${get('administration', slug)}${get('adminPhase', { ...slug, phase: phase.identifier })}${sectionQuery}`}
          activeClassName="active"
        >
          <Translate value="administration.menu.phase" count={index + 1} description={phase.title} />
        </Link>
        {subMenu && (
          <ul className={isActive ? 'shown admin-menu2' : 'hidden admin-menu2'}>
            {Object.keys(subMenu).map(key => this.renderMenuItem(subMenu[key]))}
          </ul>
        )}
      </li>
    );
  }
}
export default PhaseMenu;