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
  value: ?string
};

type DescriptionProps = {
  content: string
};

type ContentProps = {
  htmlCode: string,
  mediaFile: File
};

class TextAndMedia extends React.Component<Props> {
  static isValidDescription = (description: ?string): boolean => (description ? description !== '<p></p>' : false);

  static Title = ({ value }: TitleProps) => (
    <div className="media-title-section">
      <div className="title-hyphen">&nbsp;</div>
      <h1 className="dark-title-1">{value || I18n.t('debate.survey.titleVideo')}</h1>
    </div>
  );

  static SideDescription = ({ content }: DescriptionProps) => (
    <div className="media-description">
      <div className="media-description-icon">
        <span className="assembl-icon-pepite color2">&nbsp;</span>
      </div>
      <div className="description-txt" dangerouslySetInnerHTML={{ __html: content }} />
      <div className="box-hyphen left">&nbsp;</div>
    </div>
  );

  static TopDescription = ({ content }: DescriptionProps) => (
    <div className="media-description-layer media-description-top" dangerouslySetInnerHTML={{ __html: content }} />
  );

  static BottomDescription = ({ content }: DescriptionProps) => (
    <div className="media-description-layer media-description-bottom" dangerouslySetInnerHTML={{ __html: content }} />
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
          <Button onClick={TextAndMedia.ImageModal(<div className="media-container">{component}</div>)}>{component}</Button>
        ) : (
          component
        )}
      </div>
    );
  };

  render() {
    const { title, descriptionTop, descriptionBottom, descriptionSide, htmlCode, mediaFile, noTitle } = this.props;
    const validDescriptionSide = TextAndMedia.isValidDescription(descriptionSide);
    const validDescriptionTop = TextAndMedia.isValidDescription(descriptionTop);
    const validDescriptionBottom = TextAndMedia.isValidDescription(descriptionBottom);

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
          {!noTitle && <TextAndMedia.Title value={title} />}
          {something && (
            <Grid fluid>
              {somethingOnLeft && (
                <Col sm={totalSize} md={somethingOnRight ? leftSize : totalSize}>
                  {validDescriptionSide && <TextAndMedia.SideDescription content={descriptionSide} />}
                </Col>
              )}
              {somethingOnRight && (
                <Col sm={totalSize} md={somethingOnLeft ? rightSize : totalSize}>
                  <div className="media-right">
                    {validDescriptionTop && <TextAndMedia.TopDescription content={descriptionTop} />}
                    {validMedia && <TextAndMedia.Content htmlCode={htmlCode} mediaFile={mediaFile} />}
                    {validDescriptionSide && <TextAndMedia.SideDescription content={descriptionSide} />}
                    {validDescriptionBottom && <TextAndMedia.BottomDescription content={descriptionBottom} />}
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

export default TextAndMedia;