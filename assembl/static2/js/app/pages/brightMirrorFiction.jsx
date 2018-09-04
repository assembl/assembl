// @flow
import React, { Fragment } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
// Graphql imports
import { compose, graphql } from 'react-apollo';
import BrightMirrorFictionQuery from '../graphql/BrightMirrorFictionQuery.graphql';
// Route helpers imports
import { browserHistory } from '../router';
import { get } from '../utils/routeMap';
// HOC imports
import withLoadingIndicator from '../components/common/withLoadingIndicator';
// Components imports
import FictionHeader from '../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../components/debate/brightMirror/fictionToobar';
import FictionBody from '../components/debate/brightMirror/fictionBody';
import { displayAlert } from '../utils/utilityManager';
// Type imports
import type { CircleAvatarProps } from '../components/debate/brightMirror/circleAvatar';
import type { FictionHeaderProps } from '../components/debate/brightMirror/fictionHeader';
import type { FictionToolbarProps } from '../components/debate/brightMirror/fictionToobar';
import type { FictionBodyProps } from '../components/debate/brightMirror/fictionBody';

type BrightMirrorFictionProps = {
  data: {
    fiction: BrightMirrorFictionFragment,
    error: Object
  }
};

const BrightMirrorFiction = ({ data }: BrightMirrorFictionProps) => {
  // Handle fetching error
  if (data.error) {
    displayAlert('danger', I18n.t('error.loading'));
    return null;
  }

  // Define variables
  const { fiction, variables } = data;
  const getDisplayName = () => (fiction.creator && fiction.creator.displayName ? fiction.creator.displayName : '');
  const displayName = fiction.creator && fiction.creator.isDeleted ? I18n.t('deletedUser') : getDisplayName();

  // Define callback functions
  const deleteFiction = () => {
    // Route to fiction list page
    const fictionListURL = get('idea', { slug: 'TO_SET', phase: 'TO_SET', themeId: 'TO_SET' });
    browserHistory.push(fictionListURL);
  };

  // Define components props
  const circleAvatarProps: CircleAvatarProps = {
    username: displayName,
    src: fiction.creator && fiction.creator.image && fiction.creator.image.externalUrl ? fiction.creator.image.externalUrl : ''
  };

  const fictionHeaderProps: FictionHeaderProps = {
    authorFullname: displayName,
    publishedDate: fiction.creationDate ? fiction.creationDate.toString() : '',
    displayedPublishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.format' }),
    circleAvatar: { ...circleAvatarProps }
  };

  const fictionToolbarProps: FictionToolbarProps = {
    fictionId: variables.id,
    onDeleteCallback: deleteFiction
  };

  const fictionBodyProps: FictionBodyProps = {
    title: fiction.subject || '',
    content: fiction.body || ''
  };

  return (
    <Fragment>
      <Grid fluid className="bright-mirror-fiction background-fiction-default">
        <Row>
          <Col xs={12}>
            <article>
              <FictionHeader {...fictionHeaderProps} />
              <FictionToolbar {...fictionToolbarProps} />
              <FictionBody {...fictionBodyProps} />
            </article>
          </Col>
        </Row>
      </Grid>
    </Fragment>
  );
};

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(BrightMirrorFictionQuery, {
    // GraphQL needed input variables
    options: ({ id, contentLocale }) => ({
      variables: {
        id: id,
        contentLocale: contentLocale
      }
    })
  }),
  withLoadingIndicator()
)(BrightMirrorFiction);