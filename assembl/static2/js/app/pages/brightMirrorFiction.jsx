// @flow
import React, { Fragment } from 'react';
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

// TODO: add data.error check when displaying the page

type BrightMirrorFictionType = {
  // contentLocale: string,
  data: {
    fiction: BrightMirrorFictionFragment
  }
};

const brightMirrorFiction = ({ data }: BrightMirrorFictionType) => {
  // const { contentLocale } = this.props;
  const { fiction } = data;
  const getDisplayName = () => (fiction.creator && fiction.creator.displayName ? fiction.creator.displayName : '');
  const displayName = fiction.creator && fiction.creator.isDeleted ? I18n.t('deletedUser') : getDisplayName();

  // Define components props
  const circleAvatarProps: CircleAvatarType = {
    username: displayName,
    src: fiction.creator && fiction.creator.image && fiction.creator.image.externalUrl ? fiction.creator.image.externalUrl : ''
  };

  const fictionHeaderProps: FictionHeaderType = {
    authorFullname: displayName,
    publishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.formatHTML5' }),
    displayedPublishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.format' }),
    circleAvatar: { ...circleAvatarProps }
  };

  const fictionBodyProps: FictionBodyType = {
    title: fiction.subject ? fiction.subject : '',
    content: fiction.body ? fiction.body : ''
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
};

export default compose(graphql(BrightMirrorFictionQuery), withLoadingIndicator())(brightMirrorFiction);