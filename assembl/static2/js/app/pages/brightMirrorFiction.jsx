// @flow
import React, { Component, Fragment } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
// Graphql imports
import { compose, graphql } from 'react-apollo';
import BrightMirrorFictionQuery from '../graphql/BrightMirrorFictionQuery.graphql';
// HOC imports
import withLoadingIndicator from '../components/common/withLoadingIndicator';
// Components imports
import FictionHeader from '../components/debate/brightMirror/fictionHeader';
import FictionBody from '../components/debate/brightMirror/fictionBody';
// Type imports
import type { CircleAvatarType } from '../components/debate/brightMirror/circleAvatar';
import type { FictionHeaderType } from '../components/debate/brightMirror/fictionHeader';
import type { FictionBodyType } from '../components/debate/brightMirror/fictionBody';

type BrightMirrorFictionType = {
  // contentLocale: string,
  data: {
    fiction: BrightMirrorFictionFragment
  }
};

class BrightMirrorFiction extends Component<BrightMirrorFictionType> {
  render() {
    // const { contentLocale } = this.props;
    const { fiction } = this.props.data;

    // Define components props
    const circleAvatarProps: CircleAvatarType = {
      username: fiction.creator.username,
      src:
        fiction.creator.image && fiction.creator.image.externalUrl
          ? fiction.creator.image.externalUrl
          : '/static2/img/icons/avatar.png'
    };

    const fictionHeaderProps: FictionHeaderType = {
      authorFullname: fiction.creator.name,
      publishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.formatHTML5' }),
      displayedPublishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.format' }),
      circleAvatar: { ...circleAvatarProps }
    };

    const fictionBodyProps: FictionBodyType = {
      title: fiction.subject,
      content: fiction.body
    };

    return (
      <Fragment>
        <Grid fluid className="bright-mirror-fiction background-fiction-default">
          <Row>
            <Col xs={12}>
              <article>
                <FictionHeader {...fictionHeaderProps} />
                <FictionBody {...fictionBodyProps} />
              </article>
            </Col>
          </Row>
        </Grid>
      </Fragment>
    );
  }
}

export default compose(graphql(BrightMirrorFictionQuery), withLoadingIndicator())(BrightMirrorFiction);