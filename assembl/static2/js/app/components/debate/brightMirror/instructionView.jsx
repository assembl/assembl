// @flow
import React from 'react';
// Constant imports
import { NO_BODY_LENGTH } from '../common/topPostForm';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../common/topPostFormContainer';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import FictionsList from './fictionsList';
import InstructionsText from './instructionsText';

export type InstructionViewProps = {
  /** User connected */
  isUserConnected: boolean,
  /** Id */
  ideaId: string,
  /** Function to refetch idea */
  refetchIdea: Function,
  /** List of fictions */
  posts: Array<FictionPostPreview>,
  /** Instructions */
  announcementContent: {
    /** Instruction title */
    title: string,
    /** Instruction body */
    body: string
  },
  /** Timeline data */
  timeline: Timeline,
  /** Bright Mirror identifier */
  identifier: string,
  /** Bright Mirror lang */
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
            instructionLabelMsgId="debate.brightMirror.startFictionLabel"
            fillBodyLabelMsgId="debate.brightMirror.fillBodyLabel"
            bodyPlaceholderMsgId="debate.brightMirror.fillBodyLabel"
            postSuccessMsgId="debate.brightMirror.postSuccessMsg"
            bodyMaxLength={NO_BODY_LENGTH}
          />
        ) : null}
        <FictionsList posts={posts} identifier={identifier} themeId={ideaId} refetchIdea={refetchIdea} lang={lang} />
      </div>
    </div>
  );
};

export default InstructionView;