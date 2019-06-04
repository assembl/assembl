// @flow
import * as React from 'react';
import { Col, Row } from 'react-bootstrap';
import debounce from 'lodash/debounce';

import Section from '../common/section';
import { getPartialTree, getChildren } from '../../utils/tree';
import IdeaSynthesis from './IdeaSynthesis';
import { getDomElementOffset } from '../../utils/globalFunctions';

import type { SynthesisIdea } from './types.flow';

type IdeaSynthesisTreeProps = {
  rootIdea: SynthesisIdea,
  hasSiblings: boolean,
  slug: string,
  subIdeas: Array<SynthesisIdea>,
  index: number,
  parents: Array<number>,
  handleScrollForMenu: Function
};

type IdeaSynthesisTreeState = {
  node: ?HTMLElement
};

class IdeaSynthesisTree extends React.Component<IdeaSynthesisTreeProps, IdeaSynthesisTreeState> {
  constructor(props: IdeaSynthesisTreeProps) {
    super(props);
    this.state = {
      node: null
    };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = debounce(() => {
    const { node } = this.state;
    const { handleScrollForMenu } = this.props;
    if (node) {
      const nodeTopOffset = getDomElementOffset(node).top;
      const nodeHeight = node.getBoundingClientRect().height;
      const total = nodeTopOffset + nodeHeight;
      const scroll = window.pageYOffset + 100;
      // 100 corresponds grossly to the overlap between
      // the total of one Idea and the nodeTopOffset of the
      // following idea
      if (scroll >= nodeTopOffset && scroll < total) {
        handleScrollForMenu(node);
      }
    }
  }, 100);

  getTree = (): Array<React.Element<Row>> => {
    const { slug, subIdeas, parents, hasSiblings, index, handleScrollForMenu } = this.props;
    const { roots, descendants } = getPartialTree(subIdeas);
    const rootsHasSiblings = roots.length > 1;
    const newParents = parents.slice();
    newParents.push(index);
    const level = parents.length + 1;
    return roots.map((idea, subIndex) => (
      <Row key={idea.id}>
        <Col sm={level === 3 && hasSiblings ? 6 : 12} xs={12}>
          <IdeaSynthesisTree
            handleScrollForMenu={handleScrollForMenu}
            hasSiblings={rootsHasSiblings}
            rootIdea={idea}
            index={subIndex + 1}
            parents={newParents}
            subIdeas={getChildren(idea, descendants)}
            slug={slug}
          />
        </Col>
      </Row>
    ));
  };

  selectNode = (node: HTMLElement) => {
    this.setState({ node: node });
  };

  render() {
    const { rootIdea, index, parents, hasSiblings, slug } = this.props;
    const level = parents.length + 1;
    return (
      <Section
        displayIndex
        title={rootIdea.title}
        index={index}
        parents={parents}
        className="idea-synthesis-section"
        id={rootIdea.id}
        innerRef={this.selectNode}
      >
        <IdeaSynthesis hasSiblings={hasSiblings} level={level} idea={rootIdea} slug={slug} />
        {this.getTree()}
      </Section>
    );
  }
}

export default IdeaSynthesisTree;