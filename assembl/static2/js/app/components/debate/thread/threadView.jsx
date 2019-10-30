// @flow
import React from 'react';
import { Grid } from 'react-bootstrap';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../../../components/debate/common/topPostFormContainer';
import { Tree } from '../../../components/common/tree';
import Post from '../common/post';
import FoldedPost from '../common/post/foldedPost';
import InfiniteSeparator from '../../../components/common/infiniteSeparator';
import { getIsPhaseCompletedById } from '../../../utils/timeline';
import type { ContentLocaleMapping } from '../../../actions/actionTypes';
import ThreadPostsFilterMenu from '../common/postsFilter/thread/menu';
import ThreadPostsHashtagsFilter from '../common/postsFilter/thread/hashtagFilter';
import { defaultDisplayPolicy } from '../common/postsFilter/policies';

type Props = {
  contentLocaleMapping: ContentLocaleMapping,
  ideaId: string,
  identifier: string,
  initialRowIndex: ?number,
  isUserConnected: boolean,
  lang: string,
  messageViewOverride: string,
  noRowsRenderer: Function,
  onHashtagClick: ((href: string) => void) | null,
  phaseId: string,
  posts: Array<Post>,
  postsDisplayPolicy?: PostsDisplayPolicy,
  refetchIdea: Function,
  timeline: Timeline
};

class ThreadView extends React.Component<Props> {
  static defaultProps = {
    postsDisplayPolicy: defaultDisplayPolicy
  };

  render() {
    const {
      postsDisplayPolicy,
      isUserConnected,
      ideaId,
      contentLocaleMapping,
      refetchIdea,
      lang,
      noRowsRenderer,
      onHashtagClick,
      posts,
      initialRowIndex,
      identifier,
      phaseId,
      timeline,
      messageViewOverride
    } = this.props;
    const isPhaseCompleted = getIsPhaseCompletedById(timeline, phaseId);
    const hashtagFilter = <ThreadPostsHashtagsFilter />;
    const postsFilter = <ThreadPostsFilterMenu stickyOffset={60} stickyTopPosition={200} />

    return (
      <div>
        <TopPostFormContainer
          showForm={(!isUserConnected || connectedUserCan(Permissions.ADD_POST)) && !isPhaseCompleted}
          hashtagFilter={hashtagFilter}
          filter={postsFilter}
          ideaId={ideaId}
          refetchIdea={refetchIdea}
          topPostsCount={posts.length}
        />
        <Grid fluid className="background-grey">
          <div id="thread-view" className="max-container background-grey">
            <div className="content-section">
              <Tree
                sharedProps={{ postsDisplayPolicy: postsDisplayPolicy, onHashtagClick: onHashtagClick }}
                contentLocaleMapping={contentLocaleMapping}
                lang={lang}
                data={posts}
                initialRowIndex={initialRowIndex}
                InnerComponent={Post}
                InnerComponentFolded={FoldedPost}
                noRowsRenderer={noRowsRenderer}
                SeparatorComponent={InfiniteSeparator}
                identifier={identifier}
                phaseId={phaseId}
                messageViewOverride={messageViewOverride}
              />
            </div>
          </div>
        </Grid>
      </div>
    );
  }
}

export default ThreadView;