import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';

import Loader from '../components/common/loader';
import SynthesisQuery from '../graphql/SynthesisQuery.graphql';

export class DumbSynthesis extends React.Component {
  render() {
    const { data } = this.props;
    if (data.loading) {
      return <Loader color="black" />;
    }
    const { synthesis } = data;
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
    }
  })
)(DumbSynthesis);