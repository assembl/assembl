// @flow
import React from 'react';
// Constant imports
import { NO_BODY_LENGTH } from '../common/topPostForm';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../common/topPostFormContainer';
import { getIsPhaseCompletedById } from '../../../utils/timeline';
import FictionsList from './fictionsList';
import InstructionsText from './instructionsText';

export type InstructionViewProps = {
  isUserConnected: boolean,
  ideaId: string,
  /** Function to refetch idea */
  refetchIdea: Function,
  posts: Array<FictionPostPreview>,
  /** Instructions */
  announcementContent: {
    title: string,
    body: string
  },
  timeline: Timeline,
  /** Bright Mirror identifier */
  identifier: string,
  phaseId: string,
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
  phaseId,
  lang
}: InstructionViewProps) => {
  // Check permission
  const canPost = isUserConnected && connectedUserCan(Permissions.ADD_POST) && !getIsPhaseCompletedById(timeline, phaseId);

  const topPostFormContainer = canPost ? (
    <TopPostFormContainer
      ideaId={ideaId}
      refetchIdea={refetchIdea}
      topPostsCount={posts.length}
      instructionLabelMsgId="debate.brightMirror.startFictionLabel"
      fillBodyLabelMsgId="debate.brightMirror.fillBodyLabel"
      bodyPlaceholderMsgId="debate.brightMirror.fillBodyLabel"
      postSuccessMsgId="debate.brightMirror.postSuccessMsg"
      bodyMaxLength={NO_BODY_LENGTH}
      draftable
      draftSuccessMsgId="debate.brightMirror.draftSuccessMsg"
      fullscreen
    />
  ) : null;

  return (
    <div className="instruction-view">
      <InstructionsText title={announcementContent.title} body={announcementContent.body} />
      <div className="overflow-x">
        {topPostFormContainer}
        {posts.length > 0 ? (
          <FictionsList posts={posts} identifier={identifier} themeId={ideaId} refetchIdea={refetchIdea} lang={lang} />
        ) : null}
      </div>
    </div>
  );
};

export default InstructionView;