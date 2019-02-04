// @flow
import * as React from 'react';
import { Grid, Col } from 'react-bootstrap';
import classnames from 'classnames';
import type { AnnouncementContent } from '../debate/common/announcement';
import { renderRichtext } from '../../utils/linkify';

type DescriptionProps = {
  content: string
};

type Props = AnnouncementContent;

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
  <div className="media-description-layer media-description-top">{renderRichtext(content)}</div>
);

class TextAndMedia extends React.Component<Props> {
  render() {
    const { title, body, quote } = this.props;
    const validQuote = isValidDescription(quote);
    const validBody = isValidDescription(body);
    const somethingOnRight = validBody;
    const somethingOnLeft = validQuote;
    const something = !!(somethingOnLeft || somethingOnRight);
    const totalSize = 12;
    const leftSize = 3;
    return title || something ? (
      <section className="media-section background-light">
        <div>
          {something && (
            <Grid fluid>
              {somethingOnRight ? (
                <Col
                  xs={totalSize}
                  md={somethingOnLeft ? 9 : 12}
                  className={classnames('announcement-media no-padding', {
                    'col-md-push-3': somethingOnLeft
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
                    'col-md-pull-9': somethingOnRight
                  })}
                >
                  {quote && validQuote && <Quote content={quote} />}
                </Col>
              ) : null}
            </Grid>
          )}
        </div>
      </section>
    ) : null;
  }
}

export default TextAndMedia;