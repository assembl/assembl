import React from 'react';
import { Grid, Row } from 'react-bootstrap';

class Header extends React.Component {
  render() {
    const { title, imgUrl } = this.props;
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <h1 className="light-title-1">{title}</h1>
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <div className="header-bkg" style={{ backgroundImage: `url(${imgUrl})` }}>&nbsp;</div>
          </Row>
        </Grid>
      </section>
    );
  }
}

export default Header;
