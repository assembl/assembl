// @flow
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';
import { getPartialTree, getChildren } from '../../utils/tree';
import { getFullPath } from '../../utils/routeMap';
import { SECTION_INDEX_GENERATOR, getIndexesForIdeas } from '../../utils/section';
import type { SynthesisIdea } from './IdeaSynthesis';

type SideMenuTreeState = {
  activeKey: ?string,
  show: boolean
};

type SideMenuTreeProps = {
  rootIdea: SynthesisIdea,
  synthesisPostId: string,
  subIdeas: Array<SynthesisIdea>,
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

  getLinkContainerClassNames = (id: string) => classNames('link-container', { active: location.hash === `#${id}` });

  getTitle = (title: string, level: number, url: string, id: string) => {
    const { indexGenerator, parents, index } = this.props;
    const indexes = getIndexesForIdeas(parents, index);
    return (
      <Link
        to={url}
        onClick={() => {
          this.setState({ show: true, activeKey: id });
        }}
        className={`side-menu-link-${level}`}
      >
        {indexGenerator(indexes)} {title}
      </Link>
    );
  };

  render() {
    const { rootIdea, subIdeas, parents, index, synthesisPostId, slug } = this.props;
    const { roots, descendants } = getPartialTree(subIdeas);
    const newParents = [...parents];
    newParents.push(index);
    const level = parents.length + 1;
    const { activeKey, show } = this.state;
    const tree = roots.map((idea, subIndex) => {
      const { id } = idea;
      const url = getFullPath('synthesisIdea', { slug: slug, synthesisId: synthesisPostId, ideaId: id });
      // `/${slug}/syntheses/${synthesisPostId}#${id}`;
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
    const rootIdeaUrl = getFullPath('synthesisIdea', { slug: slug, synthesisId: synthesisPostId, ideaId: id });
    const hasChildren = subIdeas.length > 0;
    return (
      <div>
        <div className={this.getLinkContainerClassNames(id)}>
          {this.getTitle(title, level, rootIdeaUrl, id)}
          {hasChildren &&
            level === 1 && (
              <span
                className={classNames('caret pointer', { 'active-caret': show && activeKey === id })}
                onClick={() => {
                  this.setState({ activeKey: id, show: !show });
                }}
              />
            )}
        </div>
        <div>{((show && activeKey === id) || level > 1) && tree}</div>
      </div>
    );
  }
}

export default SideMenuTree;