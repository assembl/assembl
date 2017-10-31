// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

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
    return (
      <div className="max-container">
        <Translate value="synthesis.title" />
        {synthesis.ideas && <IdeaSynthesis {...synthesis.ideas[0] || {}} slug={routeParams.slug} />}
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