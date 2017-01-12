import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import AppActions from '../actions/appActions';
import Navbar from '../components/common/navbar';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.props.getSlug(this.props.params.slug);
  }
  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12} md={12}>
            <div className="navbar-fixed-top container">
              <Navbar />
            </div>
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={12}>
            <div className="app-content">
              {this.props.children}
            </div>
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    app: state.app
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    getSlug: (slug) => {
      dispatch(AppActions.getSlug(slug));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);