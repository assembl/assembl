// @flow
import * as React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';
import { getPartialTree, getChildren } from '../../utils/tree';
import { get } from '../../utils/routeMap';
import { SECTION_INDEX_GENERATOR, getIndexesForIdeas } from '../../utils/section';
import type { SynthesisIdea } from './types.flow';

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
  indexGenerator: Function,
  ideaOnScroll?: string
};

class SideMenuTree extends React.Component<SideMenuTreeProps, SideMenuTreeState> {
  static defaultProps = {
    ideaOnScroll: null
  };

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

  getLinkContainerClassNames = (id: string) => {
    const { ideaOnScroll } = this.props;
    const isIdeaOnScroll = ideaOnScroll === id;
    return classNames('link-container', { active: (location.hash === `#${id}` && isIdeaOnScroll) || isIdeaOnScroll });
  };

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
    const { rootIdea, subIdeas, parents, index, synthesisPostId, slug, ideaOnScroll } = this.props;
    const { roots, descendants } = getPartialTree(subIdeas);
    const newParents = [...parents];
    newParents.push(index);
    const level = parents.length + 1;
    const { activeKey, show } = this.state;
    const tree = roots.map((idea, subIndex) => {
      const { id } = idea;
      const url = get('synthesisIdea', { slug: slug, synthesisId: synthesisPostId, ideaId: id });
      return (
        <SideMenuTree
          ideaOnScroll={ideaOnScroll}
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
    const isIdeaOnScroll = ideaOnScroll === id;
    const isChildOnScroll = subIdeas.some(subIdea => ideaOnScroll === subIdea.id);
    const showSubIdeasTree = (show && activeKey === id) || level > 1 || isIdeaOnScroll || isChildOnScroll;
    const rootIdeaUrl = get('synthesisIdea', { slug: slug, synthesisId: synthesisPostId, ideaId: id });
    const hasChildren = subIdeas.length > 0;
    return (
      <div>
        <div className={this.getLinkContainerClassNames(id)}>
          {this.getTitle(title, level, rootIdeaUrl, id)}
          {hasChildren &&
            level === 1 && (
              <span
                className={classNames('pointer', {
                  'assembl-icon-angle-right': !showSubIdeasTree,
                  'assembl-icon-angle-down ': showSubIdeasTree,
                  'no-pointer-events': isIdeaOnScroll || isChildOnScroll
                })}
                onClick={() => {
                  this.setState({ activeKey: id, show: !show });
                }}
              />
            )}
        </div>
        <div>{showSubIdeasTree && tree}</div>
      </div>
    );
  }
}

export default SideMenuTree;