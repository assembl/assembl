// @flow
import * as React from 'react';
import Masonry from 'react-masonry-component';
import Animated from 'react-animated-transitions';

import { Grid } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { get } from '../../../utils/routeMap';

import { getDiscussionSlug } from '../../../utils/globalFunctions';
import FictionPreview from './fictionPreview';
import { fictionBackgroundColors } from '../../../constants';

type Post = {
  /** Post id */
  id: number,
  /** Subject/Title */
  subject: string,
  /** Creation date */
  creationDate: Date,
  /** Author */
  creator: {
    /** Author display name */
    displayName: string,
    /** True if user deleted */
    isDeleted: boolean
  }
};

export type FictionsListType = {
  /** All fictions */
  posts: Array<Post>,
  /** Bright Mirror identifier */
  identifier: string
};

const masonryOptions = {
  transitionDuration: 0,
  fitWidth: true,
  horizontalOrder: true
};

const getRandomColor = () => fictionBackgroundColors[Math.floor(Math.random() * fictionBackgroundColors.length)];

const FictionsList = (props: FictionsListType) => {
  const { posts, identifier } = props;
  const slug = getDiscussionSlug();

  const childElements = posts.map(post => (
    <Animated key={post.id} preset="scalein">
      <FictionPreview
        link={`${get('post', { slug: slug, phase: identifier, postId: post.id })}`} // TODO: change route to fiction route
        title={post.subject}
        creationDate={I18n.l(post.creationDate, { dateFormat: 'date.format3' })}
        authorName={post.creator.isDeleted ? I18n.t('deletedUser') : post.creator.displayName}
        color={getRandomColor()}
      />
    </Animated>
  ));

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