import React from 'react';
import { connect } from 'react-redux';
import TweetEmbed from 'react-tweet-embed';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';

class Twitter extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="twitter-section">
        {debateData.config.home.twitter &&
          <Grid fluid className="background-img" style={{ backgroundImage: `url(${debateData.config.home.twitter.backgroundImageUrl})` }}>
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
                  <TweetEmbed id={debateData.config.home.twitter.id} />
                </div>
              </Col>
            </div>
            <div className="content-end">&nbsp;</div>
          </Grid>
        }
      </section>
    );
  }
}

export default connect(MapStateToProps)(Twitter);