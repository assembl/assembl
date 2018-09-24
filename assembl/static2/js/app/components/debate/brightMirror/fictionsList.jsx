// @flow
import * as React from 'react';
import Masonry from 'react-masonry-component';
import Animated from 'react-animated-transitions';

import { Grid } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { get } from '../../../utils/routeMap';

import { getDiscussionSlug, getConnectedUserId } from '../../../utils/globalFunctions';
import FictionPreview from './fictionPreview';
import { fictionBackgroundColors, PublicationStates } from '../../../constants';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import { displayAlert } from '../../../utils/utilityManager';

export type Props = {
  posts: Array<FictionPostPreview>,
  /** Bright Mirror identifier */
  identifier: string,
  themeId: string,
  /** Function to refetch idea */
  refetchIdea: Function,
  lang: string
};

const masonryOptions = {
  transitionDuration: 0,
  fitWidth: true,
  horizontalOrder: true
};

// Define callback functions
const deleteFictionHandler = () => {
  displayAlert('success', I18n.t('debate.brightMirror.deleteFictionSuccessMsg'));
};

const getRandomColor = () => fictionBackgroundColors[Math.floor(Math.random() * fictionBackgroundColors.length)];

const FictionsList = ({ posts, identifier, refetchIdea, lang, themeId }: Props) => {
  const slug = getDiscussionSlug();

  const connectedUserId = getConnectedUserId();

  const childElements = posts.reduce((result, post) => {
    // Define user permissions
    let authorName = '';
    let userCanEdit = false;
    let userCanDelete = false;
    let isVisible = true;

    if (post.creator) {
      const { userId, displayName, isDeleted } = post.creator;
      authorName = isDeleted ? I18n.t('deletedUser') : displayName;
      userCanEdit = connectedUserId === String(userId) && connectedUserCan(Permissions.EDIT_MY_POST);
      userCanDelete =
        (connectedUserId === String(userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
        connectedUserCan(Permissions.DELETE_POST);
      isVisible =
        post.publicationState === PublicationStates.PUBLISHED ||
        (post.publicationState === PublicationStates.DRAFT && connectedUserId === String(userId));
    }

    if (isVisible) {
      result.push(
        <Animated key={post.id} preset="scalein">
          <FictionPreview
            id={post.id}
            link={`${get('brightMirrorFiction', { slug: slug, phase: identifier, themeId: themeId, fictionId: post.id })}`}
            // $FlowFixMe subject is fetch localized
            title={post.subject}
            creationDate={I18n.l(post.creationDate, { dateFormat: 'date.format2' })}
            authorName={authorName}
            color={getRandomColor()}
            // $FlowFixMe body is fetch localized
            originalBody={post.body}
            refetchIdea={refetchIdea}
            userCanEdit={userCanEdit}
            userCanDelete={userCanDelete}
            lang={lang}
            publicationState={post.publicationState}
            deleteFictionHandler={deleteFictionHandler}
          />
        </Animated>
      );
    }
    return result;
  }, []);

  return (
    <section className="fictions-section">
      <Grid fluid className="background-grey">
        <div className="max-container">
          <div className="title-section">
            <div className="title-hyphen">&nbsp;</div>
            <h1 className="dark-title-1">
              <Translate value="debate.brightMirror.allFictions" />
            </h1>
          </div>
          <div className="content-section">
            <Masonry
              className={'fictions-list'}
              elementType={'div'}
              options={masonryOptions}
              disableImagesLoaded={false}
              updateOnEachImageLoad={false}
            >
              {childElements}
            </Masonry>
          </div>
        </div>
      </Grid>
    </section>
  );
};

export default FictionsList;