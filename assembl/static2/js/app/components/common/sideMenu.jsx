// @flow
import React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { getChildren } from '../../utils/tree';
import { getDiscussionSlug } from '../../utils/globalFunctions';

type SideMenuProps = {
  rootIdeas: Array<Object>,
  descendants: Array<Object>,
  synthesisPostId: string
};

type SideMenuState = {
  activeKey: ?number,
  show: boolean
};

class SideMenu extends React.Component<*, SideMenuProps, SideMenuState> {
  props: SideMenuProps;

  state: SideMenuState;

  constructor(props: SideMenuProps) {
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
        <Translate value="synthesis.summary" className="dark-title-4" />
        {rootIdeas.map((rootIdea, index) => {
          const children = getChildren(rootIdea, descendants);
          const hasChildren = children.length > 0;
          const rootIdeaId = rootIdea.id;
          const url = slug && `/${slug}/syntheses/${synthesisPostId}#${rootIdeaId}`;
          return (
            <div key={`idea-${rootIdeaId}`}>
              <div className="flex">
                <Link to={url} className="dark-title-5 side-menu-link">
                  {rootIdea.title}
                </Link>
                {hasChildren && (
                  <span
                    className={classNames('caret pointer', { 'active-caret': show && activeKey === index })}
                    onClick={() => {
                      this.setState({ activeKey: index, show: !show });
                    }}
                  />
                )}
              </div>
              {activeKey === index &&
                show &&
                hasChildren &&
                children.map((child, idx) => {
                  const childUrl = slug && `/${slug}/syntheses/${synthesisPostId}#${child.id}`;
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