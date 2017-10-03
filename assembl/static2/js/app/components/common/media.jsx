import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Col, Button, Image, ResponsiveEmbed } from 'react-bootstrap';

import { displayModal } from '../../utils/utilityManager';

class Media extends React.Component {
  static isValidDescription = (description) => {
    return !!(description && description !== '<p></p>');
  };

  static Title = ({ value }) => {
    return (
      <div className="media-title-section">
        <div className="title-hyphen">&nbsp;</div>
        <h1 className="dark-title-1">
          {value || I18n.t('debate.survey.titleVideo')}
        </h1>
      </div>
    );
  };

  static SideDescription = ({ content }) => {
    return (
      <div className="media-description">
        <div className="media-description-icon">
          <span className="assembl-icon-pepite color2">&nbsp;</span>
        </div>
        <div className="description-txt" dangerouslySetInnerHTML={{ __html: content }} />
        <div className="box-hyphen left">&nbsp;</div>
      </div>
    );
  };

  static TopDescription = ({ content }) => {
    return <div className="media-description-layer media-description-top" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  static ImageModal = (content) => {
    return () => {
      displayModal(null, content, false, null, null, true, 'large');
    };
  };

  static Content = ({ content }) => {
    const isLocal = content[0] === '/';
    const component = isLocal
      ? <Image responsive src={content} />
      : (<ResponsiveEmbed a16by9>
        <embed src={content} />
      </ResponsiveEmbed>);
    return (
      <div className="media-container">
        {isLocal
          ? <Button
            onClick={Media.ImageModal(
              <div className="media-container">
                {component}
              </div>
            )}
          >
            {component}
          </Button>
          : component}
      </div>
    );
  };

  static BottomDescription = ({ content }) => {
    return <div className="media-description-layer media-description-bottom" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  render() {
    const { title, descriptionTop, descriptionBottom, descriptionSide, htmlCode, noTitle } = this.props;
    const validDescriptionSide = Media.isValidDescription(descriptionSide);
    const validDescriptionTop = Media.isValidDescription(descriptionTop);
    const validDescriptionBottom = Media.isValidDescription(descriptionBottom);

    const validMedia = !!htmlCode;
    const somethingOnRight = !!(validDescriptionTop || validDescriptionBottom || validMedia || validDescriptionSide);
    const somethingOnLeft = validDescriptionSide;
    const something = !!(somethingOnLeft || somethingOnRight);
    const totalSize = 12;
    const leftSize = 4;
    const rightSize = totalSize - leftSize;
    return !noTitle || something
      ? <section className="media-section background-light">
        <div className="max-container">
          {!noTitle && <Media.Title value={title} />}
          {something &&
          <Grid fluid>
            {somethingOnLeft &&
            <Col sm={totalSize} md={somethingOnRight ? leftSize : totalSize}>
              {validDescriptionSide && <Media.SideDescription content={descriptionSide} />}
            </Col>}
            {somethingOnRight &&
            <Col sm={totalSize} md={somethingOnLeft ? rightSize : totalSize}>
              <div className="media-right">
                {validDescriptionTop && <Media.TopDescription content={descriptionTop} />}
                {validMedia && <Media.Content content={htmlCode} />}
                {validDescriptionSide && <Media.SideDescription content={descriptionSide} />}
                {validDescriptionBottom && <Media.BottomDescription content={descriptionBottom} />}
              </div>
            </Col>}
          </Grid>}
        </div>
      </section>
      : null;
  }
}

/*
<div className="background-light">
  <div className="max-container">
    <section className="media-section">
      {!noTitle &&
      <div className="media-title-section">
        <div className="title-hyphen">&nbsp;</div>
        <h1 className="dark-title-1">
          {title || I18n.t('debate.survey.titleVideo')}
        </h1>
      </div>}
      <Grid fluid className="media-grid">
        <div className="content-section">
          {validDescriptionTop &&
          <Row>
            {onlyQuote &&
            <Col xs={totalSize} sm={leftSize}>
              <div className="media-description">
                <div>
                  <span className="assembl-icon-pepite color2">&nbsp;</span>
                </div>
                <div className="description-txt" dangerouslySetInnerHTML={{ __html: descriptionSide }} />
                <div className="box-hyphen left">&nbsp;</div>
              </div>
            </Col>}
            <Col
              xs={totalSize}
              sm={validDescriptionSide ? rightSize : totalSize}
              smOffset={validDescriptionSide && !onlyQuote ? leftSize : 0}
            >
              <div
                className="media-description-layer media-description-top"
                dangerouslySetInnerHTML={{ __html: descriptionTop }}
              />
              {onlyQuote &&
                    validDescriptionBottom &&
                    <div
                      className="media-description-layer media-description-bottom"
                      dangerouslySetInnerHTML={{ __html: descriptionBottom }}
                    />}
            </Col>
          </Row>}
          {!onlyQuote &&
              (validDescriptionSide || validMedia) &&
              <Row>
                {validDescriptionSide &&
                  <Col xs={totalSize} sm={leftSize}>
                    <div className="media-description">
                      <div>
                        <span className="assembl-icon-pepite color2">&nbsp;</span>
                      </div>
                      <div className="description-txt" dangerouslySetInnerHTML={{ __html: descriptionSide }} />
                      <div className="box-hyphen left">&nbsp;</div>
                    </div>
                  </Col>}
                {validMedia &&
                  <Col xs={totalSize} sm={validDescriptionSide ? rightSize : totalSize}>
                    <div className="media-container">
                      {htmlCode[0] === '/'
                        ? <img src={htmlCode} alt="media" />
                        : <object data={htmlCode} aria-label="media" />}
                    </div>
                  </Col>}
              </Row>}
          {!onlyQuote &&
              validDescriptionBottom &&
              <Row>
                <Col
                  xs={totalSize}
                  sm={validDescriptionSide ? rightSize : totalSize}
                  smOffset={validDescriptionSide ? leftSize : 0}
                >
                  <div
                    className="media-description-layer media-description-bottom"
                    dangerouslySetInnerHTML={{ __html: descriptionBottom }}
                  />
                </Col>
              </Row>}
        </div>
      </Grid>
    </section>
  </div>
</div>
*/

export default Media;