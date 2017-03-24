import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

class Video extends React.Component {
  render() {
    const { title, description, htmlCode } = this.props;
    return (
      <section className="video-section relative">
        <Grid fluid className="background-light">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">{title || I18n.t('debate.survey.titleVideo')}</h1>
            </div>
            <div className="content-section">
              <Row>
                {description &&
                  <Col xs={12} md={6}>
                    <div className="video-description">
                      <div><span className="assembl-icon-pepite color2">&nbsp;</span></div>
                      <div className="description-txt">{description}</div>
                      <div className="box-hyphen left">&nbsp;</div>
                    </div>
                  </Col>
                }
                <Col xs={12} md={6} className={description ? 'video-col' : 'col-centered no-padding'}>
                  <div className="video-container" id="video-vid">
                    <iframe src={htmlCode} frameBorder="0" width="560" height="315" />
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Video;