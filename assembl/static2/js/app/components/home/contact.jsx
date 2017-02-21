import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Button } from 'react-bootstrap';

class Contact extends React.Component {
  render() {
    return (
      <section className="contact-section">
        <div className="content-start">&nbsp;</div>
        <Grid fluid className="background-grey">
          <div className="max-container center">
            <h1 className="dark-title-1 center">
              <Translate value="home.contact" />
            </h1>
            <div className="center margin-l">
              <Button className="button-submit button-dark">
                <Translate value="home.contactUs" />
              </Button>
            </div>
          </div>
          <div className="content-end">&nbsp;</div>
        </Grid>
      </section>
    );
  }
}

export default Contact;