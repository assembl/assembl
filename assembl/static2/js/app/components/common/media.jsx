import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Col, Button, Image, ResponsiveEmbed } from 'react-bootstrap';

import { displayModal } from '../../utils/utilityManager';

class Media extends React.Component {
  static isValidDescription = description => !!(description && description !== '<p></p>');

  static Title = ({ value }) => (
    <div className="media-title-section">
      <div className="title-hyphen">&nbsp;</div>
      <h1 className="dark-title-1">{value || I18n.t('debate.survey.titleVideo')}</h1>
    </div>
  );

  static SideDescription = ({ content }) => (
    <div className="media-description">
      <div className="media-description-icon">
        <span className="assembl-icon-pepite color2">&nbsp;</span>
      </div>
      <div className="description-txt" dangerouslySetInnerHTML={{ __html: content }} />
      <div className="box-hyphen left">&nbsp;</div>
    </div>
  );

  static TopDescription = ({ content }) => (
    <div className="media-description-layer media-description-top" dangerouslySetInnerHTML={{ __html: content }} />
  );

  static ImageModal = content => () => {
    displayModal(null, content, false, null, null, true, 'large');
  };

  static Content = ({ content }) => {
    const isLocal = content[0] === '/';
    const component = isLocal ? (
      <Image responsive src={content} />
    ) : (
      <ResponsiveEmbed a16by9>
        <iframe title="media" src={content} />
      </ResponsiveEmbed>
    );
    return (
      <div className="media-container">
        {isLocal ? (
          <Button onClick={Media.ImageModal(<div className="media-container">{component}</div>)}>{component}</Button>
        ) : (
          component
        )}
      </div>
    );
  };

  static BottomDescription = ({ content }) => (
    <div className="media-description-layer media-description-bottom" dangerouslySetInnerHTML={{ __html: content }} />
  );

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
    return !noTitle || something ? (
      <section className="media-section background-light">
        <div className="max-container">
          {!noTitle && <Media.Title value={title} />}
          {something && (
            <Grid fluid>
              {somethingOnLeft && (
                <Col sm={totalSize} md={somethingOnRight ? leftSize : totalSize}>
                  {validDescriptionSide && <Media.SideDescription content={descriptionSide} />}
                </Col>
              )}
              {somethingOnRight && (
                <Col sm={totalSize} md={somethingOnLeft ? rightSize : totalSize}>
                  <div className="media-right">
                    {validDescriptionTop && <Media.TopDescription content={descriptionTop} />}
                    {validMedia && <Media.Content content={htmlCode} />}
                    {validDescriptionSide && <Media.SideDescription content={descriptionSide} />}
                    {validDescriptionBottom && <Media.BottomDescription content={descriptionBottom} />}
                  </div>
                </Col>
              )}
            </Grid>
          )}
        </div>
      </section>
    ) : null;
  }
}

export default Media;