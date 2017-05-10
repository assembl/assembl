import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import { addAdminData } from '../actions/adminActions';
import Menu from '../components/administration/menu';
import LanguageMenu from '../components/administration/languageMenu';

class Administration extends React.Component {
  constructor(props) {
    super(props);
    const { locale } = this.props.i18n;
    this.props.addAdminData(locale);
  }
  render() {
    const { phase } = this.props.params;
    return (
      <div className="administration">
        <div className="max-container">
          <Grid fluid>
            <Row>
              <Col xs={12} md={3}>
                <div className="admin-menu-container">
                  <Menu requestedPhase={phase} />
                </div>
              </Col>
              <Col xs={12} md={8}>{this.props.children}</Col>
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

const mapStateToProps = (state) => {
  return {
    i18n: state.i18n
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addAdminData: (selectedLocale) => {
      dispatch(addAdminData(selectedLocale));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Administration);