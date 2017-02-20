import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';

class Video extends React.Component {
  render() {
    return (
      <Grid fluid className="background-light">
        <div className="max-container">
          <div className="video-section">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.video" />
              </h1>
            </div>
            <div className="margin-xl">
              <Col xs={12} md={2}>&nbsp;</Col>
              <Col xs={12} md={8}>
                <div className="video-container">
                  <iframe src="https://www.youtube.com/embed/T8gC9fHGpfg" frameBorder="0" width="560" height="315"></iframe>
                </div>
              </Col>
              <Col xs={12} md={2}>&nbsp;</Col>
            </div>
          </div>
        </div>
      </Grid>
    );
  }
}

export default Video;