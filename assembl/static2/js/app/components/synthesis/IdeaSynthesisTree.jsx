// @flow

import React from 'react';
import { Col, Row } from 'react-bootstrap';

import Section from '../common/section';
import { getPartialTree, getChildren } from '../../utils/tree';
import IdeaSynthesis from './IdeaSynthesis';

import type { SynthesisIdea } from './IdeaSynthesis';

const IdeaSynthesisTree = (props: {
  rootIdea: SynthesisIdea,
  hasSiblings: boolean,
  slug: string,
  subIdeas: Array<SynthesisIdea>,
  index: number,
  parents: Array<number>
}) => {
  const { rootIdea, slug, subIdeas, index, parents, hasSiblings } = props;
  const { roots, descendants } = getPartialTree(subIdeas);
  const rootsHasSiblings = roots.length > 1;
  const newParents = parents.slice();
  newParents.push(index);
  const level = parents.length + 1;
  const tree = roots.map((idea, subIndex) => (
    <Row key={idea.id}>
      <Col sm={level === 3 && hasSiblings ? 6 : 12} xs={12}>
        <IdeaSynthesisTree
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
  return (
    <Section displayIndex title={rootIdea.title} index={index} parents={parents} className="idea-synthesis-section">
      <IdeaSynthesis hasSiblings={hasSiblings} level={level} idea={rootIdea} slug={slug} />
      {tree}
    </Section>
  );
};

export default IdeaSynthesisTree;