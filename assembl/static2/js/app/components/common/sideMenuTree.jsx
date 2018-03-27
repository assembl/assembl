// @flow
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';
import { getPartialTree, getChildren } from '../../utils/tree';
import { SECTION_INDEX_GENERATOR } from '../../utils/section';

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
  parents: Array<number>,
  indexGenerator: Function
};

class SideMenuTree extends React.Component<*, SideMenuTreeProps, SideMenuTreeState> {
  props: SideMenuTreeProps;

  state: SideMenuTreeState;

  static defaultProps = {
    indexGenerator: SECTION_INDEX_GENERATOR.alphanumericOr
  };

  constructor(props: SideMenuTreeProps) {
    super(props);
    this.state = {
      activeKey: null,
      show: false
    };
  }

  getLinkContainerClassNames = (id: string) => (location.hash === `#${id}` ? 'link-container active' : 'link-container');

  getIndexes = () => {
    const { index, parents } = this.props;
    const indexes = parents.slice();
    indexes.push(index);
    return indexes;
  };

  getTitle = (title: string, level: number, url: string, id: string) => {
    const { indexGenerator } = this.props;
    return (
      <Link
        to={url}
        onClick={() => {
          this.setState({ show: true, activeKey: id });
        }}
        className={`side-menu-link-${level}`}
      >
        {indexGenerator(this.getIndexes())}
        {title}
      </Link>
    );
  };

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
          {this.getTitle(title, level, rootIdeaUrl, id)}
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