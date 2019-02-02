// @flow
import React from 'react';
// Constant imports
import { NO_BODY_LENGTH } from '../common/topPostForm';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import TopPostFormContainer from '../common/topPostFormContainer';
import { getIsPhaseCompletedById } from '../../../utils/timeline';
import FictionsList from './fictionsList';
import InstructionsText from './instructionsText';
import { PublicationStates } from '../../../constants';
// Type imports
import type { AnnouncementContent } from '../common/announcement';
// GraphQL imports
import SemanticAnalysisForThematicQuery from '../../../graphql/SemanticAnalysisForThematicQuery.graphql';

export type InstructionViewProps = {
  isUserConnected: boolean,
  ideaId: string,
  /** Function to refetch idea */
  refetchIdea: Function,
  posts: Array<FictionPostPreview>,
  /** Instructions */
  announcementContent: AnnouncementContent,
  timeline: Timeline,
  /** Bright Mirror identifier */
  identifier: string,
  phaseId: string,
  lang: string,
  semanticAnalysisForThematicData: SemanticAnalysisForThematicQuery
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
  lang,
  semanticAnalysisForThematicData
}: InstructionViewProps) => {
  // Check permission
  const canPost = isUserConnected && connectedUserCan(Permissions.ADD_POST) && !getIsPhaseCompletedById(timeline, phaseId);

  // Filter out DELETED_BY_USER and DELETED_BY_ADMIN posts
  const filteredPosts = posts.filter(
    post =>
      post.publicationState !== PublicationStates.DELETED_BY_ADMIN && post.publicationState !== PublicationStates.DELETED_BY_USER
  );

  const topPostFormContainer = canPost ? (
    <TopPostFormContainer
      ideaId={ideaId}
      refetchIdea={refetchIdea}
      topPostsCount={filteredPosts.length}
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
      <InstructionsText
        title={announcementContent.title || ''}
        body={announcementContent.body}
        summary={announcementContent.summary}
        semanticAnalysisForThematicData={semanticAnalysisForThematicData}
      />
      <div>
        {topPostFormContainer}
        {filteredPosts.length > 0 ? (
          <FictionsList posts={filteredPosts} identifier={identifier} themeId={ideaId} refetchIdea={refetchIdea} lang={lang} />
        ) : null}
      </div>
    </div>
  );
};

export default InstructionView;