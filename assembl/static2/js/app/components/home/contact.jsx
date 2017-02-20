import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Button } from 'react-bootstrap';

class Contact extends React.Component {
  render() {
    return (
      <Grid fluid>
        <div className="max-container background-grey margin-xl center contact">
          <h1 className="dark-title-1">
            <Translate value="home.contact" />
          </h1>
          <div className="center margin-m">
            <Button className="button-submit button-dark">
              <Translate value="home.contactUs" />
            </Button>
          </div>
        </div>
      </Grid>
    );
  }
}

export default Contact;