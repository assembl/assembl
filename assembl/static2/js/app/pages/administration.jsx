import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import Menu from '../components/administration/menu';
import LanguageMenu from '../components/administration/languageMenu';

class Administration extends React.Component {
  render() {
    const { phase } = this.props.params;
    return (
      <div className="administration">
        <div className="max-container">
          <Grid fluid>
            <Row>
              <Col xs={12} md={12}>
                <LanguageMenu />
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={4}>
                <div className="admin-menu-container">
                  <Menu requestedPhase={phase} />
                </div>
              </Col>
              <Col xs={12} md={8}>{this.props.children}</Col>
            </Row>
          </Grid>
        </div>
      </div>
    );
  }
}

export default Administration;