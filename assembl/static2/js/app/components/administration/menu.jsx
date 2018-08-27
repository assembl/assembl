import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import PhaseMenu from './phaseMenu';
import { ADMIN_MENU } from '../../constants';

class Menu extends React.PureComponent {
  renderMenuItem = (id, menuItem, slug, isRoot = true) => {
    const { requestedPhase } = this.props;
    const { title, sectionId, subMenu } = menuItem;
    const sectionQuery = sectionId ? `?section=${sectionId}` : '';
    return (
      <li key={sectionId} className={isRoot ? 'menu-item' : ''}>
        <Link to={`${get('administration', slug)}/${id}${sectionQuery}`} activeClassName="active">
          <Translate value={title} />
        </Link>
        {subMenu ? (
          <ul className={requestedPhase === id ? 'shown admin-menu2' : 'hidden admin-menu2'}>
            {Object.keys(subMenu).map((subKey) => {
              const subMenuItem = subMenu[subKey];
              return this.renderMenuItem(id, subMenuItem, slug, false);
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
          ? timeline.map((phase, phaseIndex) => (
            <PhaseMenu
              key={phaseIndex}
              slug={slug}
              index={phaseIndex}
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