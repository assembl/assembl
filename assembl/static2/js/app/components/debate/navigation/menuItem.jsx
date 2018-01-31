// @flow
import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { get } from '../../../utils/routeMap';
import PostsAndContributorsCount from '../../common/postsAndContributorsCount';

type ItemNode = {
  id: string,
  title: string,
  img: {
    externalUrl: string
  },
  numContributors: number,
  numPosts: number
};

type MenuItemProps = {
  item: ItemNode,
  identifier: string,
  selected: boolean,
  hasSubItems: boolean,
  slug: string,
  onClick: Function,
  onMouseOver: Function,
  onMouseLeave: Function
};

type MenuItemState = {
  active: boolean
};

export class DumbMenuItem extends React.Component<*, MenuItemProps, MenuItemState> {
  state = {
    active: false
  };

  showMenu = () => {
    const { onMouseOver, item } = this.props;
    this.setState({ active: true }, () => {
      if (onMouseOver) onMouseOver(item.id);
    });
  };

  hideMenu = () => {
    const { onMouseLeave, item } = this.props;
    this.setState({ active: false }, () => {
      if (onMouseLeave) onMouseLeave(item.id);
    });
  };

  render() {
    const { identifier, item, selected, hasSubItems, slug, onClick } = this.props;
    const { id, title, img, numContributors, numPosts } = item;
    const { active } = this.state;
    const isSelected = active || selected;
    const displayArrow = isSelected && hasSubItems;
    return (
      <div
        className={classNames('menu-item-container', {
          active: isSelected,
          empty: isSelected && !displayArrow
        })}
        onMouseOver={this.showMenu}
        onMouseLeave={this.hideMenu}
      >
        <Link
          onClick={onClick}
          className="menu-item"
          to={`${get('themeInPhase', { slug: slug, phase: identifier, themeId: id })}`}
        >
          <div className="thumb-img" style={img && img.externalUrl ? { backgroundImage: `url(${img.externalUrl})` } : null}>
            <div className="thumb-img-background" />
          </div>
          <div className="thumb-body">
            <div title={title} className="thumb-title">
              {title}
            </div>
            <PostsAndContributorsCount className="menu-stats" numContributors={numContributors} numPosts={numPosts} />
          </div>
          {displayArrow && <span className="thumb-arrow assembl-icon assembl-icon-right-dir" />}
        </Link>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  slug: state.debate.debateData.slug
});

export default connect(mapStateToProps)(DumbMenuItem);