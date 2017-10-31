// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import IdeaSynthesis from '../components/synthesis/IdeaSynthesis';

type SynthesisProps = {
  synthesis: Object
};

export class DumbSynthesis extends React.Component<void, SynthesisProps, void> {
  props: SynthesisProps;
  render() {
    const { synthesis } = this.props;
    return (
      <div className="max-container">
        <Translate value="synthesis.title" />
        <IdeaSynthesis {...synthesis} />
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