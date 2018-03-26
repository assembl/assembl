// @flow
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';
import { getPartialTree, getChildren } from '../../utils/tree';

type SideMenuTreeState = {
  activeKey: ?string,
  show: boolean
};

type SideMenuTreeProps = {
  rootIdea: Object,
  synthesisPostId: string,
  subIdeas: Array<Object>,
  index: number,
  slug: string,
  parents: Array<number>
};

class SideMenuTree extends React.Component<*, SideMenuTreeProps, SideMenuTreeState> {
  props: SideMenuTreeProps;

  state: SideMenuTreeState;

  constructor(props: SideMenuTreeProps) {
    super(props);
    this.state = {
      activeKey: null,
      show: false
    };
  }

  getLinkContainerClassNames = (id: string) => (location.hash === `#${id}` ? 'link-container active' : 'link-container');

  render() {
    const { rootIdea, subIdeas, parents, index, synthesisPostId, slug } = this.props;
    const { roots, descendants } = getPartialTree(subIdeas);
    const newParents = parents.slice();
    newParents.push(index);
    const level = parents.length + 1;
    const { activeKey, show } = this.state;
    const tree = roots.map((idea, subIndex) => {
      const { id } = idea;
      const url = `/${slug}/syntheses/${synthesisPostId}#${id}`;
      return (
        <SideMenuTree
          key={id}
          rootIdea={idea}
          index={subIndex + 1}
          parents={newParents}
          subIdeas={getChildren(idea, descendants)}
          url={url}
          synthesisPostId={synthesisPostId}
          slug={slug}
        />
      );
    });
    const { id, title } = rootIdea;
    const rootIdeaUrl = `/${slug}/syntheses/${synthesisPostId}#${id}`;
    const hasChildren = subIdeas.length > 0;
    return (
      <div>
        <div className={this.getLinkContainerClassNames(id)}>
          <Link
            to={rootIdeaUrl}
            onClick={() => {
              this.setState({ show: true, activeKey: id });
            }}
            className={`side-menu-link-${level}`}
          >
            {title}
          </Link>
          {hasChildren && (
            <span
              className={classNames('caret pointer', { 'active-caret': show && activeKey === id })}
              onClick={() => {
                this.setState({ activeKey: id, show: !show });
              }}
            />
          )}
        </div>
        <div>{hasChildren && show && activeKey === id && tree}</div>
      </div>
    );
  }
}

export default SideMenuTree;