// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Col, Button, Image, ResponsiveEmbed } from 'react-bootstrap';

import { displayModal } from '../../utils/utilityManager';

type File = {
  externalUrl: string
};
type Props = {
  title: string,
  descriptionTop: string,
  descriptionBottom: string,
  descriptionSide: string,
  htmlCode: string,
  mediaFile: File,
  noTitle: boolean
};

type TitleProps = {
  value: ?string // eslint-disable-line
};

type SideDescriptionProps = {
  content: string // eslint-disable-line
};

type TopDescriptionProps = {
  content: string // eslint-disable-line
};

type BottomDescription = {
  content: string // eslint-disable-line
};

type ContentProps = {
  htmlCode: string,
  mediaFile: File
};

class Media extends React.Component<Props> {
  static isValidDescription = (description: ?string): boolean => description !== '<p></p>';

  static Title = ({ value }: TitleProps) => (
    <div className="media-title-section">
      <div className="title-hyphen">&nbsp;</div>
      <h1 className="dark-title-1">{value || I18n.t('debate.survey.titleVideo')}</h1>
    </div>
  );

  static SideDescription = ({ content }: SideDescriptionProps) => (
    <div className="media-description">
      <div className="media-description-icon">
        <span className="assembl-icon-pepite color2">&nbsp;</span>
      </div>
      <div className="description-txt" dangerouslySetInnerHTML={{ __html: content }} />
      <div className="box-hyphen left">&nbsp;</div>
    </div>
  );

  static TopDescription = ({ content }: TopDescriptionProps) => (
    <div className="media-description-layer media-description-top" dangerouslySetInnerHTML={{ __html: content }} />
  );

  static ImageModal = (content: React.Node) => () => {
    displayModal(null, content, false, null, null, true, 'large');
  };

  static Content = ({ htmlCode, mediaFile }: ContentProps) => {
    const isLocal = !htmlCode && mediaFile && mediaFile.externalUrl;
    const component = isLocal ? (
      <Image responsive src={mediaFile.externalUrl} />
    ) : (
      <ResponsiveEmbed a16by9>
        <iframe title="media" src={htmlCode} />
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

  static BottomDescription = ({ content }: BottomDescription) => (
    <div className="media-description-layer media-description-bottom" dangerouslySetInnerHTML={{ __html: content }} />
  );

  render() {
    const { title, descriptionTop, descriptionBottom, descriptionSide, htmlCode, mediaFile, noTitle } = this.props;
    const validDescriptionSide = Media.isValidDescription(descriptionSide);
    const validDescriptionTop = Media.isValidDescription(descriptionTop);
    const validDescriptionBottom = Media.isValidDescription(descriptionBottom);

    const validMedia = !!(htmlCode || mediaFile);
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
                    {validMedia && <Media.Content htmlCode={htmlCode} mediaFile={mediaFile} />}
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