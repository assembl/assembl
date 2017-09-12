import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

class Video extends React.Component {
  render() {
    const { title, descriptionTop, descriptionBottom, htmlCode } = this.props;
    return (
      <section className="video-section relative">
        <Grid fluid className="background-light">
          <div className="max-container">
            <div className="video-title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {title || I18n.t('debate.survey.titleVideo')}
              </h1>
            </div>
            <div className="content-section">
              {descriptionTop &&
                <Row>
                  <div
                    className="video-description-layer video-description-top"
                    dangerouslySetInnerHTML={{ __html: descriptionTop }}
                  />
                </Row>}
              <Row>
                {htmlCode &&
                  <div className="video-container" id="video-vid">
                    <iframe src={htmlCode} frameBorder="0" width="560" height="315" title="video" />
                  </div>}
              </Row>
              {descriptionBottom &&
                <Row>
                  <div
                    className="video-description-layer video-description-bottom"
                    dangerouslySetInnerHTML={{ __html: descriptionBottom }}
                  />
                </Row>}
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Video;