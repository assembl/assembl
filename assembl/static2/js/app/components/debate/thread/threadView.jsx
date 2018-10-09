import React from 'react';
import { Grid } from 'react-bootstrap';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../../../components/debate/common/topPostFormContainer';
import { Tree } from '../../../components/common/tree';
import Post from '../common/post';
import FoldedPost from '../common/post/foldedPost';
import InfiniteSeparator from '../../../components/common/infiniteSeparator';
import { getIfPhaseCompletedById } from '../../../utils/timeline';

class ThreadView extends React.Component {
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
      timeline
    } = this.props;
    const isPhaseCompleted = getIfPhaseCompletedById(timeline, phaseId);
    return (
      <div className="overflow-x">
        {(!isUserConnected || connectedUserCan(Permissions.ADD_POST)) && !isPhaseCompleted ? (
          <TopPostFormContainer ideaId={ideaId} refetchIdea={refetchIdea} topPostsCount={posts.length} />
        ) : null}
        <Grid fluid className="background-grey">
          <div className="max-container background-grey">
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
              />
            </div>
          </div>
        </Grid>
      </div>
    );
  }
}

export default ThreadView;