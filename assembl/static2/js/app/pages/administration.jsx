import React from 'react';
import { compose, graphql } from 'react-apollo';
import { filter } from 'graphql-anywhere';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';

import { updateThematics } from '../actions/adminActions';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import Menu from '../components/administration/menu';
import LanguageMenu from '../components/administration/languageMenu';
import SaveButton from '../components/administration/saveButton';
import ThematicsQuery from '../graphql/ThematicsQuery.graphql';

class Administration extends React.Component {
  constructor() {
    super();
    this.putThematicsInStore.bind(this);
  }

  componentDidMount() {
    this.putThematicsInStore(this.props.data);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.thematics !== this.props.data.thematics) {
      this.putThematicsInStore(nextProps.data);
    }
  }

  putThematicsInStore(data) {
    // filter with the same query to remove stuff like __typename from the structure
    const filteredThematics = filter(ThematicsQuery, data);
    this.props.updateThematics(filteredThematics.thematics);
  }

  render() {
    const { children, data, params } = this.props;
    const { phase } = params;
    return (
      <div className="administration">
        <div className="save-bar">
          <div className="max-container">
            <Grid fluid>
              <Row>
                <Col xs={12} md={3} />
                <Col xs={12} md={8}>
                  <SaveButton refetchThematics={data.refetch} />
                </Col>
                <Col xs={12} md={1} />
              </Row>
            </Grid>
          </div>
        </div>
        <div className="max-container">
          <Grid fluid>
            <Row>
              <Col xs={12} md={3}>
                <div className="admin-menu-container">
                  <Menu requestedPhase={phase} />
                </div>
              </Col>
              <Col xs={12} md={8}>{children}</Col>
              <Col xs={12} md={1}>
                <LanguageMenu />
              </Col>
            </Row>
          </Grid>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateThematics: (thematics) => {
      return dispatch(updateThematics(thematics));
    }
  };
};

export default compose(
  connect(null, mapDispatchToProps),
  graphql(ThematicsQuery, {
    options: { variables: { identifier: 'survey' } }
  }),
  withLoadingIndicator()
)(Administration);