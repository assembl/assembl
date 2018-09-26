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
import BackButton from '../components/debate/common/backButton';

// Utils imports
import { displayAlert } from '../utils/utilityManager';
import { getConnectedUserId } from '../utils/globalFunctions';
import Permissions, { connectedUserCan } from '../utils/permissions';
// Constant imports
import { FICTION_DELETE_CALLBACK, PublicationStates } from '../constants';
// Type imports
import type { CircleAvatarProps } from '../components/debate/brightMirror/circleAvatar';
import type { FictionHeaderProps } from '../components/debate/brightMirror/fictionHeader';
import type { FictionToolbarProps } from '../components/debate/brightMirror/fictionToolbar';
import type { FictionBodyProps } from '../components/debate/brightMirror/fictionBody';

// Define types
export type Data = {
  /** Fiction object formatted through GraphQL  */
  fiction: BrightMirrorFictionFragment,
  /** GraphQL error object used to handle fetching errors */
  error: any
};

export type Props = {
  /** Fiction data information fetched from GraphQL */
  data: Data,
  /** URL slug */
  slug: string,
  /** Fiction phase */
  phase: string,
  /** Fiction theme identifier */
  themeId: string,
  /** Fiction identifier */
  fictionId: string,
  /** Fiction locale */
  contentLocale: string
};

type State = {
  /** Fiction title */
  title: string,
  /** Fiction content */
  content: string,
  /** Fiction publication state */
  publicationState: string
};

const EMPTY_STRING = '';

export class BrightMirrorFiction extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      title: props.data.fiction.subject || EMPTY_STRING,
      content: props.data.fiction.body || EMPTY_STRING,
      publicationState: props.data.fiction.publicationState || PublicationStates.PUBLISHED
    };
  }

  render() {
    const { data, slug, phase, themeId, fictionId, contentLocale } = this.props;
    const { title, content, publicationState } = this.state;
    // Handle fetching error
    if (data.error) {
      displayAlert('danger', I18n.t('error.loading'));
      return null;
    }
    // Define variables
    const { fiction } = data;
    const getDisplayName = () => (fiction.creator && fiction.creator.displayName ? fiction.creator.displayName : EMPTY_STRING);
    const displayName = fiction.creator && fiction.creator.isDeleted ? I18n.t('deletedUser') : getDisplayName();
    // Define user permission
    const USER_ID_NOT_FOUND = -9999;
    const userId = fiction.creator ? fiction.creator.userId : USER_ID_NOT_FOUND;
    const userCanDelete =
      (getConnectedUserId() === String(userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);
    const userCanEdit = getConnectedUserId() === String(userId) && connectedUserCan(Permissions.EDIT_MY_POST);
    // Define callback functions
    const deleteFictionCallback = () => {
      // Route to fiction list page
      const fictionListParams = { slug: slug, phase: phase, themeId: themeId };
      const fictionListURL = get('idea', fictionListParams);
      // Set a callback state in order to display a delete fiction confirmation message
      browserHistory.push({
        pathname: fictionListURL,
        state: { callback: FICTION_DELETE_CALLBACK }
      });
    };
    const modifyFictionCallback = (subject, body, state) => {
      this.setState({ title: subject, content: body, publicationState: state });
    };
    const backBtnCallback = () => {
      browserHistory.push(`${get('idea', { slug: slug, phase: phase, themeId: themeId })}`);
    };
    // Define components props
    const circleAvatarProps: CircleAvatarProps = {
      username: displayName,
      src:
        fiction.creator && fiction.creator.image && fiction.creator.image.externalUrl
          ? fiction.creator.image.externalUrl
          : EMPTY_STRING
    };
    const fictionHeaderProps: FictionHeaderProps = {
      authorFullname: displayName,
      publishedDate: fiction.creationDate ? fiction.creationDate.toString() : EMPTY_STRING,
      displayedPublishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.format' }),
      circleAvatar: { ...circleAvatarProps }
    };
    const fictionToolbarProps: FictionToolbarProps = {
      fictionId: fictionId,
      title: title,
      originalBody: content,
      lang: contentLocale,
      publicationState: publicationState,
      userCanEdit: userCanEdit,
      userCanDelete: userCanDelete,
      onModifyCallback: modifyFictionCallback,
      onDeleteCallback: deleteFictionCallback
    };
    const fictionBodyProps: FictionBodyProps = {
      title: title,
      content: content
    };
    return (
      <Fragment>
        <div className="bright-mirror-fiction background-fiction-default">
          <BackButton handleClick={backBtnCallback} linkClassName="back-btn" />
          <Grid fluid>
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
        </div>
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