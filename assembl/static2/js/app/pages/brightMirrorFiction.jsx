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
import FictionToolbar from '../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../components/debate/brightMirror/fictionBody';
// Utils imports
import { displayAlert } from '../utils/utilityManager';
import { getConnectedUserId } from '../utils/globalFunctions';
import Permissions, { connectedUserCan } from '../utils/permissions';
// Type imports
import type { CircleAvatarProps } from '../components/debate/brightMirror/circleAvatar';
import type { FictionHeaderProps } from '../components/debate/brightMirror/fictionHeader';
import type { FictionToolbarProps } from '../components/debate/brightMirror/fictionToolbar';
import type { FictionBodyProps } from '../components/debate/brightMirror/fictionBody';

// Define types
type BrightMirrorFictionData = {
  /** Fiction object formatted through GraphQL  */
  fiction: BrightMirrorFictionFragment,
  /** GraphQL error object used to handle fetching errors */
  error: Object
};

type BrightMirrorFictionProps = {
  /** Fiction data information fetched from GraphQL */
  data: BrightMirrorFictionData,
  /** URL slug */
  slug: string,
  /** Fiction phase */
  phase: string,
  /** Fiction theme identifier */
  themeId: string,
  /** Fiction identifier */
  fictionId: string
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

  // WIP: display success message when deleting a fiction
  // displayAlert('success', I18n.t('debate.brightMirror.deleteFictionSuccessMsg'));

  render() {
    const { data, slug, phase, themeId } = this.props;
    // Handle fetching error
    if (data.error) {
      displayAlert('danger', I18n.t('error.loading'));
      return null;
    }

    // Define variables
    const { fiction } = data;
    const getDisplayName = () => (fiction.creator && fiction.creator.displayName ? fiction.creator.displayName : '');
    const displayName = fiction.creator && fiction.creator.isDeleted ? I18n.t('deletedUser') : getDisplayName();

    // Define user permission
    const userCanDelete =
      (getConnectedUserId() === String(fiction.creator.userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);
    const userCanEdit = getConnectedUserId() === String(fiction.creator.userId) && connectedUserCan(Permissions.EDIT_MY_POST);

    // Define callback functions
    const deleteFictionCallback = () => {
      // Route to fiction list page
      const fictionListParams = { slug: slug, phase: phase, themeId: themeId };
      const fictionListURL = get('idea', fictionListParams);
      browserHistory.push(fictionListURL);
    };

    const modifyFictionCallback = (subject, body) => {
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
      fictionId: id,
      title: this.state.title,
      originalBody: this.state.content,
      lang: contentLocale,
      userCanEdit: userCanEdit,
      userCanDelete: userCanDelete,
      onModifyCallback: modifyFictionCallback,
      onDeleteCallback: deleteFictionCallback
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
    options: ({ fictionId, contentLocale }) => ({
      variables: {
        id: fictionId,
        contentLocale: contentLocale
      }
    })
  }),
  withLoadingIndicator()
)(BrightMirrorFiction);