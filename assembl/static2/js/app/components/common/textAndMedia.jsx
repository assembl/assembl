// @flow
import * as React from 'react';
import { Grid, Col } from 'react-bootstrap';
import classnames from 'classnames';
import type { AnnouncementContent } from '../debate/common/announcement';
import { transformLinksInHtml } from '../../utils/linkify';
import { Html, postBodyReplacementComponents } from '../debate/common/post/postBody';

type DescriptionProps = {
  content: string
};

type Props = AnnouncementContent & {
  children?: React.Node
};

const isValidDescription = (description: ?string): boolean => (description ? description !== '<p></p>' : false);

const Quote = ({ content }: DescriptionProps) => (
  <div className="media-description">
    <div className="media-description-icon">
      <span className="assembl-icon-pepite color2">&nbsp;</span>
    </div>
    <div className="description-txt" dangerouslySetInnerHTML={{ __html: content }} />
    <div className="box-hyphen left">&nbsp;</div>
  </div>
);

const Body = ({ content }: DescriptionProps) => (
  <div className="media-description-layer media-description-top">
    <Html rawHtml={transformLinksInHtml(content)} replacementComponents={postBodyReplacementComponents()} />
  </div>
);

class TextAndMedia extends React.Component<Props> {
  render() {
    const { title, body, quote, children } = this.props;
    const validQuote = isValidDescription(quote);
    const validBody = isValidDescription(body);
    const somethingOnRight = validBody;
    const somethingOnLeft = validQuote || children;
    const something = !!(somethingOnLeft || somethingOnRight);
    const totalSize = 12;
    const leftSize = 4;
    return title || something ? (
      <section className="media-section background-light">
        <div className="max-container">
          {something && (
            <Grid fluid>
              {somethingOnRight ? (
                <Col
                  xs={totalSize}
                  md={8}
                  className={classnames('announcement-media', {
                    'col-md-push-2': !somethingOnLeft,
                    'col-md-push-4': somethingOnLeft
                  })}
                >
                  <div className="media-right">{body && validBody && <Body content={body} />}</div>
                </Col>
              ) : null}
              {validQuote ? (
                <Col
                  xs={totalSize}
                  md={somethingOnRight ? leftSize : totalSize}
                  className={classnames({
                    'col-md-pull-8': somethingOnRight
                  })}
                >
                  {quote && validQuote && <Quote content={quote} />}
                </Col>
              ) : null}
              {children}
            </Grid>
          )}
        </div>
      </section>
    ) : null;
  }
}

export default TextAndMedia;