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
    return (
      <div>
        {(!isUserConnected || connectedUserCan(Permissions.ADD_POST)) && !isPhaseCompleted ? (
          <TopPostFormContainer ideaId={ideaId} refetchIdea={refetchIdea} topPostsCount={posts.length} />
        ) : null}
        <Grid fluid className="background-grey">
          <div id="thread-view" className="max-container background-grey">
            <ThreadPostsFilterMenu stickyOffset={60} stickyTopPosition={200} />
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