// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';

import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { type MenuItem } from '../../utils/administration/menu';
import PhaseMenu from './phaseMenu';
import { ADMIN_MENU } from '../../constants';

type Props = {
  thematicId: ?string,
  requestedPhase: string,
  locale: string,
  timeline: Timeline
};

class Menu extends React.PureComponent<Props> {
  renderMenuItem = (
    id: string,
    menuItem: MenuItem,
    slug: { slug: string | null },
    rootSection: string = '',
    isRoot: boolean = true,
    queryArgs: { thematicId?: ?string } = {}
  ) => {
    const { requestedPhase } = this.props;
    const { title, sectionId, subMenu } = menuItem;
    const sectionIndex = rootSection ? `${rootSection}.${sectionId}` : sectionId;
    const sectionQuery = sectionId ? { section: sectionIndex, ...queryArgs } : {};
    const subMenuIds = subMenu ? Object.keys(subMenu) : [];
    const newRootSection = !isRoot ? sectionIndex : '';
    const isActive = requestedPhase === id;
    return (
      <li key={id + sectionIndex} className={isRoot ? 'menu-item' : ''}>
        <Link to={`${get('administration', { ...slug, id: id }, sectionQuery)}`} activeClassName="active">
          <Translate value={title} />
        </Link>
        {subMenu && subMenuIds.length > 0 ? (
          <ul className={classNames('admin-menu2', { shown: isActive, hidden: !isActive })}>
            {subMenuIds.map((subKey) => {
              const subMenuItem = subMenu[subKey];
              return this.renderMenuItem(id, subMenuItem, slug, newRootSection, false, queryArgs);
            })}
          </ul>
        ) : null}
      </li>
    );
  };

  render() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props;
    const { requestedPhase, thematicId, locale } = this.props;
    return (
      <ul className="admin-menu">
        {Object.keys(ADMIN_MENU)
          .filter(key => key !== 'voteSession')
          .map(key => this.renderMenuItem(key, ADMIN_MENU[key], slug))}
        {requestedPhase === 'voteSession'
          ? this.renderMenuItem('voteSession', ADMIN_MENU.voteSession, slug, '', true, { thematicId: thematicId })
          : null}
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