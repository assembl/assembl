// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import Header from '../components/common/header';
import Section from '../components/common/section';

import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import IdeaSynthesisTree from '../components/synthesis/IdeaSynthesis';
import { getPartialTree, getChildren } from '../utils/tree';

type SynthesisProps = {
  synthesis: Object,
  routeParams: Object
};

export class DumbSynthesis extends React.Component<void, SynthesisProps, void> {
  props: SynthesisProps;

  render() {
    const { synthesis, routeParams } = this.props;
    const { introduction, conclusion, ideas, subject } = synthesis;
    const { roots, children } = getPartialTree(ideas);
    return (
      <div className="max-container">
        <Header title={subject} imgUrl={synthesis.imgUrl} isSynthesesHeader />
        {introduction &&
          <Section title="introduction">
            <div dangerouslySetInnerHTML={{ __html: introduction }} />
          </Section>}

        {roots.map((rootIdea, index) => {
          return (
            <IdeaSynthesisTree
              key={rootIdea.id}
              {...rootIdea}
              index={index + 1}
              parents={[]}
              subIdeas={getChildren(rootIdea, children)}
              slug={routeParams.slug}
            />
          );
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