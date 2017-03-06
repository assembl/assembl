import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { Grid, Row, Col } from 'react-bootstrap';

class Contact extends React.Component {
  render() {
    return (
      <section className="contact-section">
        <Grid fluid className="background-grey">
          <div className="max-container center">
            <div className="margin-xl">
              <h1 className="dark-title-1 center">
                <Translate value="home.contact" />
              </h1>
            </div>
            <div className="center" style={{ margin: '60px 0' }}>
              <Row>
                <Col md={12}>
                  <Link className="button-link button-dark" to="http://bluenove.com/contactus/" target="_blank">
                    <Translate value="home.contactUs" />
                  </Link>
                </Col>
              </Row>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Contact;