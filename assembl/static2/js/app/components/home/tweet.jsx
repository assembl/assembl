import React from 'react';
import TweetEmbed from 'react-tweet-embed';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';

class Tweet extends React.Component {
  render() {
    return (
      <div className="twitter">
        <Grid fluid>
          <div className="max-container">
            <div className="single-tweet">
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="home.twitterTitle" />
                </h1>
              </div>
              <div className="tweet-content">
                <TweetEmbed id='808390464667721728'></TweetEmbed>
              </div>
            </div>
          </div>
        </Grid>
        <Grid fluid className="tweet-bkg" style={{ backgroundImage: `url(http://www.france-montagnes.com/sites/default/files/styles/header_webzine/public/header/fotolia_60491751_subscription_xxl.jpg?itok=0i9faW99)` }}>
          &nbsp;
        </Grid>
      </div>
    );
  }
}

export default Tweet;