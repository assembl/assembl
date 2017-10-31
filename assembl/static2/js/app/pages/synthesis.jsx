// @flow
import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';

export class DumbSynthesis extends React.Component {
  render() {
    const { synthesis } = this.props;
    return (
      <Grid fluid>
        <div className="max-container">
          <Col xs={12} sm={12}>
            <div>
              {synthesis.subject}
            </div>
          </Col>
        </div>
      </Grid>
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
      return {
        data: { loading: data.loading },
        synthesis: data.synthesis
      };
    }
  }),
  withLoadingIndicator()
)(DumbSynthesis);