// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import Header from '../components/common/header';
import Section from '../components/common/section';

import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import IdeaSynthesis from '../components/synthesis/IdeaSynthesis';

type SynthesisProps = {
  synthesis: Object,
  routeParams: Object
};

export class DumbSynthesis extends React.Component<void, SynthesisProps, void> {
  props: SynthesisProps;

  render() {
    const { synthesis, routeParams } = this.props;
    const { introduction, conclusion, ideas, subject } = synthesis;

    return (
      <div className="max-container">
        <Header title={subject} imgUrl={ideas[ideas.length - 1].imgUrl} isSynthesesHeader />
        {introduction &&
          <Section title="Introduction">
            <div dangerouslySetInnerHTML={{ __html: introduction }} />
          </Section>}

        {ideas &&
          ideas.map((idea) => {
            return <IdeaSynthesis {...idea} slug={routeParams.slug} key={idea.id} />;
          })}

        {conclusion &&
          <Section title="Conclusion">
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