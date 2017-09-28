import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

import { fetchContentType } from '../../utils/httpRequestHandler';

const isValidDescription = (description) => {
  return !!(description && description !== '<p></p>');
};

const createHTMLTag = (contentType, url) => {
  // undefined content types (ex 'application') will fall through to <object />
  return (
    (contentType &&
      {
        image: <img src={url} alt="media" />
      }[contentType.split('/')[0]]) ||
      <object data={url} aria-label="media" />
  );
};

class Media extends React.Component {
  constructor(props) {
    super(props);
    this.state = { contentType: null };
  }
  componentWillMount() {
    fetchContentType(this.props.htmlCode).then(this.setContentType);
  }
  setContentType = (contentType) => {
    this.setState({ contentType: contentType });
  };
  render() {
    const { title, descriptionTop, descriptionBottom, descriptionSide, htmlCode, noTitle } = this.props;
    const { contentType } = this.state;
    const validDescriptionSide = isValidDescription(descriptionSide);
    const validDescriptionTop = isValidDescription(descriptionTop);
    const validDescriptionBottom = isValidDescription(descriptionBottom);
    return title || validDescriptionTop || validDescriptionSide || htmlCode || validDescriptionBottom
      ? <section className="media-section relative">
        <Grid fluid className="background-light">
          <div className="max-container">
            {!noTitle &&
            <div className="media-title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {title || I18n.t('debate.survey.titleVideo')}
              </h1>
            </div>}
            <div className="content-section">
              {validDescriptionTop &&
              <Row>
                <Col xs={12} sm={validDescriptionSide ? 6 : 8} smOffset={validDescriptionSide ? 4 : 2}>
                  <div
                    className="media-description-layer media-description-top"
                    dangerouslySetInnerHTML={{ __html: descriptionTop }}
                  />
                </Col>
              </Row>}
              {(validDescriptionSide || htmlCode) &&
              <Row>
                {validDescriptionSide &&
                <Col xs={12} sm={3} smOffset={1}>
                  <div className="media-description">
                    <div>
                      <span className="assembl-icon-pepite color2">&nbsp;</span>
                    </div>
                    <div className="description-txt" dangerouslySetInnerHTML={{ __html: descriptionSide }} />
                    <div className="box-hyphen left">&nbsp;</div>
                  </div>
                </Col>}
                {htmlCode &&
                <Col xs={12} sm={validDescriptionSide ? 6 : 8} smOffset={validDescriptionSide ? 0 : 2}>
                  <div className="media-container">
                    {createHTMLTag(contentType, htmlCode)}
                  </div>
                </Col>}
              </Row>}
              {validDescriptionBottom &&
              <Row>
                <Col xs={12} sm={validDescriptionSide ? 6 : 8} smOffset={validDescriptionSide ? 4 : 2}>
                  <div
                    className="media-description-layer media-description-bottom"
                    dangerouslySetInnerHTML={{ __html: descriptionBottom }}
                  />
                </Col>
              </Row>}
            </div>
          </div>
        </Grid>
      </section>
      : null;
  }
}

export default Media;