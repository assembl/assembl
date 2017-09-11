import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

class Video extends React.Component {
  render() {
    const { title, descriptionTop, descriptionBottom, descriptionSide, htmlCode } = this.props;
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
                  <Col xs={12} sm={descriptionSide ? 6 : 8} smOffset={descriptionSide ? 4 : 2}>
                    <div
                      className="video-description-layer video-description-top"
                      dangerouslySetInnerHTML={{ __html: descriptionTop }}
                    />
                  </Col>
                </Row>}
              <Row>
                {descriptionSide &&
                  <Col xs={12} sm={3} smOffset={1}>
                    <div className="video-description">
                      <div>
                        <span className="assembl-icon-pepite color2">&nbsp;</span>
                      </div>
                      <div className="description-txt" dangerouslySetInnerHTML={{ __html: descriptionSide }} />
                      <div className="box-hyphen left">&nbsp;</div>
                    </div>
                  </Col>}
                {htmlCode &&
                  <Col xs={12} sm={descriptionSide ? 6 : 8} smOffset={descriptionSide ? 0 : 2}>
                    <div className="video-container" id="video-vid">
                      <iframe src={htmlCode} frameBorder="0" width="560" height="315" title="video" />
                    </div>
                  </Col>}
              </Row>
              <Row>
                {descriptionBottom &&
                  <Col xs={12} sm={descriptionSide ? 6 : 8} smOffset={descriptionSide ? 4 : 2}>
                    <div
                      className="video-description-layer video-description-bottom"
                      dangerouslySetInnerHTML={{ __html: descriptionBottom }}
                    />
                  </Col>}
              </Row>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Video;