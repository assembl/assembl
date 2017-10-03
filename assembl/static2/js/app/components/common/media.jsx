import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';

const isValidDescription = (description) => {
  return !!(description && description !== '<p></p>');
};

const Title = ({ value }) => {
  return (
    <div className="media-title-section">
      <div className="title-hyphen">&nbsp;</div>
      <h1 className="dark-title-1">
        {value || I18n.t('debate.survey.titleVideo')}
      </h1>
    </div>
  );
};

const SideDescription = ({ content }) => {
  return (
    <div className="media-description">
      <div>
        <span className="assembl-icon-pepite color2">&nbsp;</span>
      </div>
      <div className="description-txt" dangerouslySetInnerHTML={{ __html: content }} />
      <div className="box-hyphen left">&nbsp;</div>
    </div>
  );
};

const TopDescription = ({ content }) => {
  return <div className="media-description-layer media-description-bottom" dangerouslySetInnerHTML={{ __html: content }} />;
};

const MediaContent = ({ content }) => {
  return (
    <div className="media-container">
      {content[0] === '/' ? <img src={content} alt="media" /> : <object data={content} aria-label="media" />}
    </div>
  );
};

const BottomDescription = ({ content }) => {
  return <div className="media-description-layer media-description-bottom" dangerouslySetInnerHTML={{ __html: content }} />;
};

class Media extends React.Component {
  render() {
    const { title, descriptionTop, descriptionBottom, descriptionSide, htmlCode, noTitle } = this.props;
    const validDescriptionSide = isValidDescription(descriptionSide);
    const validDescriptionTop = isValidDescription(descriptionTop);
    const validDescriptionBottom = isValidDescription(descriptionBottom);

    const validMedia = !!htmlCode;
    const somethingOnRight = !!(validDescriptionTop || validDescriptionBottom || validMedia);
    const somethingOnLeft = validDescriptionSide;
    const something = !!(somethingOnLeft || somethingOnRight);
    const totalSize = 12;
    const leftSize = 4;
    const rightSize = totalSize - leftSize;
    return !noTitle || validDescriptionTop || validDescriptionSide || validMedia || validDescriptionBottom
      ? <section className="media-section background-light">
        <div className="max-container">
          {!noTitle && <Title value={title} />}
          {something &&
          <Grid fluid>
            {somethingOnLeft &&
            <Col xs={totalSize} sm={somethingOnRight ? leftSize : totalSize}>
              <SideDescription content={descriptionSide} />
            </Col>}
            {somethingOnRight &&
            <Col xs={totalSize} sm={somethingOnLeft ? rightSize : totalSize}>
              <TopDescription content={descriptionTop} />
              <MediaContent content={htmlCode} />
              <BottomDescription content={descriptionBottom} />
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