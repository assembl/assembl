import React from 'react';
import { Link } from 'react-router';
import { getChildren } from '../../utils/tree';
import { getDiscussionSlug } from '../../utils/globalFunctions';

class SideMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: null,
      show: false
    };
  }

  render() {
    const { rootIdeas, descendants, synthesisPostId } = this.props;
    const { activeKey, show } = this.state;
    const slug = getDiscussionSlug();
    return (
      <div className="synthesis-side-menu">
        <div className="dark-title-2">SOMMAIRE</div>
        {rootIdeas.map((rootIdea, index) => {
          const children = getChildren(rootIdea, descendants);
          const hasChildren = children.length > 0;
          const url = `/${slug}/syntheses/${synthesisPostId}#${rootIdea.id}`;
          return (
            <div key={`idea-${index}`}>
              <Link to={url} className="dark-title-4 side-menu-link">
                {rootIdea.title}
              </Link>
              {hasChildren && (
                <span
                  className="caret pointer"
                  onClick={() => {
                    this.setState({ activeKey: index, show: !show });
                  }}
                />
              )}
              {activeKey === index &&
                show &&
                hasChildren &&
                children.map((child, idx) => {
                  const childUrl = `/${slug}/syntheses/${synthesisPostId}#${child.id}`;
                  return (
                    <Link to={childUrl} className="dark-title-3 side-menu-link child-link shown" key={`child-${idx}`}>
                      {child.title}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </div>
    );
  }
}

export default SideMenu;