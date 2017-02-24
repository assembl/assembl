import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';

class Video extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="video-section">
        {debateData.config.home.video &&
          <Grid fluid className="background-light">
            <div className="max-container">
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="home.video" />
                </h1>
              </div>
              <div className="content-section">
                <div className="content-margin">
                  <Row>
                    {debateData.config.home.video.videoText &&
                      <Col xs={12} md={6}>
                        <div className="text">{debateData.config.home.video.videoText}</div>
                      </Col>
                    }
                    <Col xs={12} md={6}>
                      <div className="video-container">
                        <iframe src={debateData.config.home.video.videoUrl} frameBorder="0" width="560" height="315" />
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </div>
          </Grid>
        }
      </section>
    );
  }
}

export default connect(MapStateToProps)(Video);