import React from 'react';
import TweetEmbed from 'react-tweet-embed';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';

class Twitter extends React.Component {
  render() {
    return (
      <section className="twitter-section">
        <Grid fluid className="background-img" style={{ backgroundImage: `url(http://www.france-montagnes.com/sites/default/files/styles/header_webzine/public/header/fotolia_60491751_subscription_xxl.jpg?itok=0i9faW99)` }}>
          <div className="content-start">&nbsp;</div>
          <div className="max-container">
            <Col xs={12} md={6} className="no-padding background-light">
              <div className="tweet-container">
                <div className="title-section">
                  <div className="title-hyphen">&nbsp;</div>
                  <h1 className="dark-title-1">
                    <Translate value="home.twitterTitle" />
                  </h1>
                </div>
                <TweetEmbed id='808390464667721728'></TweetEmbed>
              </div>
            </Col>
          </div>
          <div className="content-end">&nbsp;</div>
        </Grid>
      </section>
    );
  }
}

export default Twitter;