// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import Header from '../components/common/header';
import Section from '../components/common/section';

import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import IdeaSynthesisTree from '../components/synthesis/IdeaSynthesis';

type SynthesisProps = {
  synthesis: Object,
  routeParams: Object
};

const findIdeaParent = (idea, ideas) => {
  return ideas.find((otherIdea) => {
    return idea.parentId === otherIdea.id;
  });
};

const findIdeaRootParent = (idea, ideas) => {
  let rootParent;
  let potentialParent = idea;
  do {
    rootParent = potentialParent;
    potentialParent = findIdeaParent(rootParent, ideas);
  } while (potentialParent !== undefined);
  return rootParent;
};

const constructIdeasTreeChild = (idea, ideas) => {
  const childs = ideas.filter((potentialChild) => {
    return potentialChild.parentId === idea.id;
  });
  return childs.map((child) => {
    return {
      ...child,
      subIdeas: constructIdeasTreeChild(child, ideas)
    };
  });
};

const constructIdeasTree = (ideas) => {
  const rootParents = ideas.filter((idea) => {
    return findIdeaRootParent(idea, ideas) === idea;
  });
  return rootParents.map((parentIdea) => {
    return { ...parentIdea, subIdeas: constructIdeasTreeChild(parentIdea, ideas) };
  });
};

export class DumbSynthesis extends React.Component<void, SynthesisProps, void> {
  props: SynthesisProps;

  render() {
    const { synthesis, routeParams } = this.props;
    const { introduction, conclusion, ideas, subject } = synthesis;
    const ideasTree = constructIdeasTree(ideas);
    return (
      <div className="max-container">
        <Header title={subject} imgUrl={synthesis.imgUrl} isSynthesesHeader />
        {introduction &&
          <Section title="introduction">
            <div dangerouslySetInnerHTML={{ __html: introduction }} />
          </Section>}

        {ideas &&
          ideasTree.map((idea) => {
            return <IdeaSynthesisTree {...idea} slug={routeParams.slug} key={idea.id} />;
          })}

        {conclusion &&
          <Section title="conclusion">
            <div dangerouslySetInnerHTML={{ __html: conclusion }} />
          </Section>}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(SynthesisQuery, {
    options: (props) => {
      return {
        variables: { id: props.params.synthesisId }
      };
    },
    props: ({ data }) => {
      if (data.loading) {
        return { dataLoading: true };
      }
      return {
        synthesis: data.synthesis
      };
    }
  }),
  withLoadingIndicator()
)(DumbSynthesis);