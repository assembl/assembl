import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { get } from '../../../utils/routeMap';
import PostsAndContributorsCount from '../../common/postsAndContributorsCount';

class ThematicTableItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false
    };
  }

  showMenu = () => {
    const { onMouseOver, thematic } = this.props;
    this.setState({ active: true }, () => {
      if (onMouseOver) onMouseOver(thematic.id);
    });
  };

  hideMenu = () => {
    const { onMouseLeave, thematic } = this.props;
    this.setState({ active: false }, () => {
      if (onMouseLeave) onMouseLeave(thematic.id);
    });
  };

  render() {
    const { identifier, thematic, slug } = this.props;
    const { id, title, img, numContributors, numPosts } = thematic;
    const { active } = this.state;
    return (
      <div
        className={classNames('thematic-item-container', {
          active: active
        })}
        onMouseOver={this.showMenu}
        onMouseLeave={this.hideMenu}
      >
        <Link
          className="thematic-item"
          to={`${get('debate', { slug: slug, phase: identifier })}${get('theme', { themeId: id })}`}
        >
          <div className="thumb-img" style={img && img.externalUrl ? { backgroundImage: `url(${img.externalUrl})` } : null}>
            <div className="thumb-img-background" />
          </div>
          <div className="thumb-body">
            <div className="thumb-title">{title}</div>
            <PostsAndContributorsCount className="thematic-stats" numContributors={numContributors} numPosts={numPosts} />
          </div>
          {active && <span className="thumb-arrow assembl-icon assembl-icon-right-dir" />}
        </Link>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

export default connect(mapStateToProps)(ThematicTableItem);