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

export type InstructionViewProps = {
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

const InstructionView = ({
  isUserConnected,
  ideaId,
  refetchIdea,
  posts,
  announcementContent,
  timeline,
  identifier,
  lang
}: InstructionViewProps) => {
  const canPost =
    isUserConnected && connectedUserCan(Permissions.ADD_POST) && !getIfPhaseCompletedByIdentifier(timeline, identifier);

  return (
    <div className="instruction-view">
      <InstructionsText title={announcementContent.title} body={announcementContent.body} />
      <div className="overflow-x">
        {canPost ? (
          <TopPostFormContainer
            ideaId={ideaId}
            refetchIdea={refetchIdea}
            topPostsCount={posts.length}
            instructionLabel="debate.brightMirror.startFictionLabel"
            fillBodyLabel="debate.brightMirror.fillBodyLabel"
            bodyPlaceholder="debate.brightMirror.fillBodyLabel"
            postSuccessMsg="debate.brightMirror.postSuccessMsg"
          />
        ) : null}
        <FictionsList posts={posts} identifier={identifier} lang={lang} />
      </div>
    </div>
  );
};

export default InstructionView;