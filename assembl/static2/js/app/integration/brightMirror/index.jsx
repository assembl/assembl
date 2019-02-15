import React, { Component } from 'react';

import { customFictionsList } from '../../stories/components/debate/brightMirror/fictionsList.stories';
import { customInstructionsText } from '../../stories/components/debate/brightMirror/instructionsText.stories';
import FictionsList from '../../components/debate/brightMirror/fictionsList';
import InstructionsText from '../../components/debate/brightMirror/instructionsText';
import TopPostFormContainer from '../../components/debate/common/topPostFormContainer';

const timeline = [
  {
    identifier: 'brightMirror',
    start: '1900-01-01T02:00:00Z',
    end: '2200-01-01T00:00:00Z',
    title: { entries: [{ en: 'brightMirror' }] }
  }
];
const props = {
  isUserConnected: true,
  ideaId: 0,
  refetchIdea: Function,
  posts: [],
  timeline: timeline,
  identifier: 'brightMirror'
};

class Index extends Component {
  render() {
    return (
      <div className="instruction-view">
        <InstructionsText {...customInstructionsText} />
        <div>
          <TopPostFormContainer
            ideaId={props.ideaId}
            refetchIdea={props.refetchIdea}
            topPostsCount={props.posts.length}
            instructionLabelMsgId="debate.brightMirror.startFictionLabel"
            fillBodyLabelMsgId="debate.brightMirror.fillBodyLabel"
            bodyPlaceholderMsgId="debate.brightMirror.fillBodyLabel"
            postSuccessMsgId="debate.brightMirror.postSuccessMsg"
          />
          <FictionsList {...customFictionsList} />
        </div>
      </div>
    );
  }
}

export default Index;