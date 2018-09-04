// @flow
import * as React from 'react';
import Masonry from 'react-masonry-component';
import Animated from 'react-animated-transitions';

import { Grid } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { get } from '../../../utils/routeMap';

import { getDiscussionSlug, getConnectedUserId } from '../../../utils/globalFunctions';
import FictionPreview from './fictionPreview';
import { fictionBackgroundColors } from '../../../constants';
import Permissions, { connectedUserCan } from '../../../utils/permissions';

export type FictionsListProps = {
  /** All fictions */
  posts: Array<FictionPostPreview>,
  /** Bright Mirror identifier */
  identifier: string,
  /** Theme identifier */
  themeId: string,
  /** Function to refetch idea */
  refetchIdea: Function,
  /** Content locale */
  lang: string
};

const masonryOptions = {
  transitionDuration: 0,
  fitWidth: true,
  horizontalOrder: true
};

const getRandomColor = () => fictionBackgroundColors[Math.floor(Math.random() * fictionBackgroundColors.length)];

const FictionsList = ({ posts, identifier, refetchIdea, lang, themeId }: FictionsListProps) => {
  const slug = getDiscussionSlug();

  const connectedUserId = getConnectedUserId();

  const childElements = posts.map((post) => {
    let authorName = '';
    let userCanEditThisMessage;
    if (post.creator) {
      const { userId, displayName, isDeleted } = post.creator;
      authorName = isDeleted ? I18n.t('deletedUser') : displayName;
      userCanEditThisMessage = connectedUserId === String(userId) && connectedUserCan(Permissions.EDIT_MY_POST);
    } else {
      authorName = '';
      userCanEditThisMessage = false;
    }

    return (
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
          userCanEditThisMessage={userCanEditThisMessage}
          lang={lang}
        />
      </Animated>
    );
  });

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