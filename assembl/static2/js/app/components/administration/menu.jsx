// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { type MenuItem } from '../../utils/administration/menu';
import PhaseMenu from './phaseMenu';
import { ADMIN_MENU } from '../../constants';

type Props = {
  requestedPhase: string,
  i18n: { locale: string },
  timeline: Timeline
};

class Menu extends React.PureComponent<Props> {
  renderMenuItem = (id: string, menuItem: MenuItem, slug: { slug: string | null }, rootSection: string = '') => {
    const { requestedPhase } = this.props;
    const { title, sectionId, subMenu } = menuItem;
    const isRoot = !rootSection;
    const sectionIndex = rootSection ? `${rootSection}.${sectionId}` : sectionId;
    const sectionQuery = sectionId ? `?section=${sectionIndex}` : '';
    const subMenuIds = subMenu ? Object.keys(subMenu) : [];
    const hasSubMenu = subMenuIds.length;
    return (
      <li key={sectionId} className={isRoot ? 'menu-item' : ''}>
        <Link to={`${get('administration', slug)}/${id}${sectionQuery}`} activeClassName="active">
          <Translate value={title} />
        </Link>
        {subMenu && hasSubMenu ? (
          <ul className={requestedPhase === id ? 'shown admin-menu2' : 'hidden admin-menu2'}>
            {subMenuIds.map((subKey) => {
              const subMenuItem = subMenu[subKey];
              return this.renderMenuItem(id, subMenuItem, slug, sectionIndex);
            })}
          </ul>
        ) : null}
      </li>
    );
  };

  render() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props;
    const { requestedPhase, i18n: { locale } } = this.props;
    return (
      <ul className="admin-menu">
        {Object.keys(ADMIN_MENU).map(key => this.renderMenuItem(key, ADMIN_MENU[key], slug))}
        {timeline
          ? timeline.map((phase, index) => (
            <PhaseMenu
              key={phase.id}
              slug={slug}
              index={index}
              phase={phase}
              isActive={phase.identifier === requestedPhase}
              locale={locale}
            />
          ))
          : null}
      </ul>
    );
  }
}

export default Menu;