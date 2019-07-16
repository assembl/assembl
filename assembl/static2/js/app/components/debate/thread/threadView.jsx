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
import PostsFilterMenu from '../common/postsFilter/menu';

type Props = {
  isUserConnected: boolean,
  ideaId: string,
  contentLocaleMapping: ContentLocaleMapping,
  refetchIdea: Function,
  lang: string,
  noRowsRenderer: Function,
  posts: Array<Post>,
  initialRowIndex: ?number,
  identifier: string,
  phaseId: string,
  timeline: Timeline,
  messageViewOverride: string
};

class ThreadView extends React.Component<Props> {
  render() {
    const {
      isUserConnected,
      ideaId,
      contentLocaleMapping,
      refetchIdea,
      lang,
      noRowsRenderer,
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
            <PostsFilterMenu />
            <div className="content-section">
              <Tree
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