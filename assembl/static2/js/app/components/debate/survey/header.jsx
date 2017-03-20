import React from 'react';
import { Grid, Row } from 'react-bootstrap';

class Header extends React.Component {
  render() {
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <h1 className="light-title-1">titre</h1>
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <div className="header-bkg" style={{ backgroundImage: 'url(/data/Discussion/6/documents/425/data)' }}>&nbsp;</div>
          </Row>
        </Grid>
      </section>
    );
  }
}

export default Header;
