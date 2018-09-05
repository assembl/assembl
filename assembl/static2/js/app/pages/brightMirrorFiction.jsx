// @flow
import React, { Fragment, Component } from 'react';
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
import Permissions, { connectedUserCan } from '../utils/permissions';
import { getConnectedUserId } from '../utils/globalFunctions';

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

type BrightMirrorFictionState = {
  title: string,
  content: string
};

class BrightMirrorFiction extends Component<BrightMirrorFictionProps, BrightMirrorFictionState> {
  constructor(props) {
    super(props);
    this.state = {
      title: this.props.data.fiction.subject ? this.props.data.fiction.subject : '',
      content: this.props.data.fiction.body ? this.props.data.fiction.body : ''
    };
  }

  render() {
    const { data } = this.props;
    // Handle fetching error
    if (data.error) {
      displayAlert('danger', I18n.t('error.loading'));
      return null;
    }

    // Define variables
    const { fiction, variables } = data;
    const getDisplayName = () => (fiction.creator && fiction.creator.displayName ? fiction.creator.displayName : '');
    const displayName = fiction.creator && fiction.creator.isDeleted ? I18n.t('deletedUser') : getDisplayName();

    const userCanEdit = getConnectedUserId() === String(fiction.creator.userId) && connectedUserCan(Permissions.EDIT_MY_POST);

    // Define callback functions
    const deleteFiction = () => {
      // Route to fiction list page
      const fictionListURL = get('idea', { slug: 'TO_SET', phase: 'TO_SET', themeId: 'TO_SET' });
      browserHistory.push(fictionListURL);
    };

    const onModifyCallback = (subject, body) => {
      this.setState({ title: subject, content: body });
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
      onDeleteCallback: deleteFiction,
      userCanEdit: userCanEdit,
      title: this.state.title,
      originalBody: this.state.content,
      onModifyCallback: onModifyCallback,
      lang: variables.contentLocale
    };

    const fictionBodyProps: FictionBodyProps = {
      title: this.state.title,
      content: this.state.content
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
  }
}

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