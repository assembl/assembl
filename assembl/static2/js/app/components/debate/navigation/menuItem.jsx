// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { get, goTo } from '../../../utils/routeMap';
import { MESSAGE_VIEW } from '../../../constants';

import PostsAndContributorsCount from '../../common/postsAndContributorsCount';

type ItemNode = {
  id: string,
  title: string,
  img: {
    externalUrl: string
  },
  messageViewOverride: string,
  numContributors: number,
  numPosts: number,
  numVotes: number
};

type MenuItemProps = {
  item: ItemNode,
  identifier: string,
  phaseId: string,
  selected: boolean,
  hasSubItems: boolean,
  slug: string,
  onClick: Function,
  toggleMenu: Function
};

export class DumbMenuItem extends React.Component<MenuItemProps> {
  onLinkClick = () => {
    const { identifier, phaseId, item, slug, onClick } = this.props;
    if (onClick) onClick();
    goTo(get('idea', { slug: slug, phase: identifier, phaseId: phaseId, themeId: item.id }));
  };

  render() {
    const { item, selected, hasSubItems, toggleMenu } = this.props;
    const { title, img, messageViewOverride, numContributors, numPosts, numVotes } = item;
    // The first touch show the menu and the second activate the link
    const onLinkClick = this.onLinkClick;
    return (
      <div
        className={classNames('menu-item-container', {
          active: selected
        })}
      >
        <div
          onClick={messageViewOverride !== MESSAGE_VIEW.noModule ? onLinkClick : null}
          style={messageViewOverride === MESSAGE_VIEW.noModule ? { cursor: 'default' } : undefined}
          className="menu-item"
        >
          <div className="thumb-img" style={img && img.externalUrl ? { backgroundImage: `url(${img.externalUrl})` } : null}>
            <div className="thumb-img-background" />
          </div>
          <div className="thumb-body">
            <div title={title} className="thumb-title">
              {title}
            </div>
            {messageViewOverride !== MESSAGE_VIEW.noModule ? (
              <PostsAndContributorsCount
                className="menu-stats"
                showNumPosts={messageViewOverride !== MESSAGE_VIEW.voteSession}
                showNumVotes={messageViewOverride === MESSAGE_VIEW.voteSession}
                numPosts={numPosts}
                numContributors={numContributors}
                numVotes={numVotes}
              />
            ) : null}
          </div>
        </div>
        <div onClick={() => toggleMenu(item.id)}>
          {hasSubItems && (
            <span
              className={classNames('thumb-arrow assembl-icon', {
                'assembl-icon-angle-down': selected,
                'assembl-icon-angle-right': !selected
              })}
            />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  slug: state.debate.debateData.slug
});

export default connect(mapStateToProps)(DumbMenuItem);