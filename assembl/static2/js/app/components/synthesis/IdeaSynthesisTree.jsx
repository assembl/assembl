// @flow

import React from 'react';
import { Col } from 'react-bootstrap';

import Section from '../common/section';
import { getPartialTree, getChildren } from '../../utils/tree';
import IdeaSynthesis from './IdeaSynthesis';

import type { SynthesisIdea } from './IdeaSynthesis';

const ColContainer = (children) => {
  return (
    <Col sm={6} xs={12}>
      {children}
    </Col>
  );
};

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
  const content = (
    <Section displayIndex title={rootIdea.title} index={index} parents={parents} className="idea-synthesis-section">
      <IdeaSynthesis hasSiblings={hasSiblings} level={level} idea={rootIdea} slug={slug} />
      {roots.map((idea, subIndex) => {
        return (
          <IdeaSynthesisTree
            key={idea.id}
            hasSiblings={rootsHasSiblings}
            rootIdea={idea}
            index={subIndex + 1}
            parents={newParents}
            subIdeas={getChildren(idea, descendants)}
            slug={slug}
          />
        );
      })}
    </Section>
  );
  const container = level === 3 && hasSiblings ? ColContainer : null;
  return container ? container(content) : content;
};

export default IdeaSynthesisTree;