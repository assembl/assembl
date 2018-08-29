// @flow
import React from 'react';

import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../common/topPostFormContainer';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import FictionsList from './fictionsList';
import InstructionsText from './instructionsText';

type Post = {
  id: number,
  subject: string,
  creationDate: Date,
  creator: {
    displayName: string,
    isDeleted: boolean
  }
};

type Props = {
  isUserConnected: boolean,
  ideaId: string,
  refetchIdea: Function,
  posts: Array<Post>,
  announcementContent: {
    title: string,
    body: string
  },
  timeline: Timeline,
  identifier: string,
  lang: string
};

const InstructionView = (props: Props) => {
  const canPost =
    props.isUserConnected &&
    connectedUserCan(Permissions.ADD_POST) &&
    !getIfPhaseCompletedByIdentifier(props.timeline, props.identifier);

  return (
    <div className="instruction-view">
      <InstructionsText title={props.announcementContent.title} body={props.announcementContent.body} />
      <div className="overflow-x">
        {canPost ? (
          <TopPostFormContainer
            ideaId={props.ideaId}
            refetchIdea={props.refetchIdea}
            topPostsCount={props.posts.length}
            instructionLabel="debate.brightMirror.startFictionLabel"
            fillBodyLabel="debate.brightMirror.fillBodyLabel"
            bodyPlaceholder="debate.brightMirror.fillBodyLabel"
            postSuccessMsg="debate.brightMirror.postSuccessMsg"
          />
        ) : null}
        <FictionsList posts={props.posts} identifier={props.identifier} lang={props.lang} />
      </div>
    </div>
  );
};

export default InstructionView;