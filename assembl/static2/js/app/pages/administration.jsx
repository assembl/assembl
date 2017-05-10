import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

import Menu from '../components/administration/menu';
import LanguageMenu from '../components/administration/languageMenu';

const Administration = ({ children, params }) => {
  const { phase } = params;
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
            <Col xs={12} md={8}>{children}</Col>
            <Col xs={12} md={1}>
              <LanguageMenu />
            </Col>
          </Row>
        </Grid>
      </div>
    </div>
  );
};

export default Administration;