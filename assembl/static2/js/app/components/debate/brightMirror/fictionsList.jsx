// @flow
import * as React from 'react';
import Masonry from 'react-masonry-component';
import Animated from 'react-animated-transitions';
import { Grid } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
// Route helpers imports
import { get } from '../../../utils/routeMap';
// Utils imports
import { getDiscussionSlug, getConnectedUserId } from '../../../utils/globalFunctions';
import FictionPreview from './fictionPreview';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import { displayAlert } from '../../../utils/utilityManager';
// Constant imports
import { EMPTY_STRING } from '../../../constants';
// Type imports
import type { BrightMirrorFictionProps } from '../../../pages/brightMirrorFiction';

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

const publicationStateCreationDateComparator = (a, b) => {
  const aDate: string = a.creationDate;
  const bDate: string = b.creationDate;
  const aState = a.publicationState;
  const bState = b.publicationState;

  if (aState === bState) {
    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  }
  return aState < bState ? -1 : 1;
};

const FictionsList = ({ posts, identifier, refetchIdea, lang, themeId }: Props) => {
  const slug = getDiscussionSlug() || EMPTY_STRING;

  const connectedUserId = getConnectedUserId();

  const childElements = posts.sort(publicationStateCreationDateComparator).reduce((result, post) => {
    // Define user permissions
    let authorName = '';
    let userCanEdit = false;
    let userCanDelete = false;

    if (post.creator) {
      const { userId, displayName, isDeleted } = post.creator;
      authorName = isDeleted ? I18n.t('deletedUser') : displayName;
      userCanEdit = connectedUserId === String(userId) && connectedUserCan(Permissions.EDIT_MY_POST);
      userCanDelete =
        (connectedUserId === String(userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
        connectedUserCan(Permissions.DELETE_POST);
    }
    // Define bright mirror fiction props
    const fictionMetaInfo: BrightMirrorFictionProps = {
      slug: slug,
      phase: identifier,
      themeId: themeId,
      fictionId: post.id
    };

    result.push(
      <Animated key={post.id} preset="scalein">
        <FictionPreview
          id={post.id}
          link={`${get('brightMirrorFiction', fictionMetaInfo)}`}
          title={post.subject}
          creationDate={I18n.l(post.creationDate, { dateFormat: 'date.format2' })}
          authorName={authorName}
          originalBody={post.body || EMPTY_STRING}
          refetchIdea={refetchIdea}
          userCanEdit={userCanEdit}
          userCanDelete={userCanDelete}
          lang={lang}
          publicationState={post.publicationState}
          deleteFictionHandler={deleteFictionHandler}
          fictionMetaInfo={fictionMetaInfo}
        />
      </Animated>
    );
    return result;
  }, []);

  return (
    <section className="fictions-section">
      <Grid fluid className="background-grey">
        <div className="max-container">
          <div className="title-section">
            <div className="title-hyphen">&nbsp;</div>
            <h1 className="dark-title-1">
              <Translate value="debate.brightMirror.numberOfFictions" count={childElements.length} />
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