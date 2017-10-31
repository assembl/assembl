import React from 'react';
import { Grid } from 'react-bootstrap';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../../../components/debate/common/topPostFormContainer';
import Tree from '../../../components/common/tree';
import Post, { PostFolded } from '../../../components/debate/thread/post';
import InfiniteSeparator from '../../../components/common/infiniteSeparator';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

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
      debateData
    } = this.props;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
    return (
      <div className="overflow-x">
        {(!isUserConnected || connectedUserCan(Permissions.ADD_POST)) && !isPhaseCompleted
          ? <TopPostFormContainer ideaId={ideaId} refetchIdea={refetchIdea} />
          : null}
        <Grid fluid className="background-grey">
          <div className="max-container background-grey">
            <div className="content-section">
              <Tree
                contentLocaleMapping={contentLocaleMapping}
                lang={lang}
                data={posts}
                initialRowIndex={initialRowIndex}
                InnerComponent={Post}
                InnerComponentFolded={PostFolded}
                noRowsRenderer={noRowsRenderer}
                SeparatorComponent={InfiniteSeparator}
                identifier={identifier}
              />
            </div>
          </div>
        </Grid>
      </div>
    );
  }
}

export default ThreadView;