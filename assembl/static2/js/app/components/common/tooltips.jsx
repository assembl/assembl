// @flow

import * as React from 'react';
import { Tooltip } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type TooltipProps = {
  level: number
};

export const addSectionTooltip = (
  <Tooltip id="addSectionTooltip">
    <Translate value="administration.sections.addSection" />
  </Tooltip>
);

export const deleteSectionTooltip = (
  <Tooltip id="deleteSectionTooltip">
    <Translate value="administration.sections.deleteSection" />
  </Tooltip>
);

export const addVoteProposalTooltip = (
  <Tooltip id="addProposalTooltip">
    <Translate value="administration.voteProposals.addProposal" />
  </Tooltip>
);

export const deleteVoteProposalTooltip = (
  <Tooltip id="deleteProposalTooltip">
    <Translate value="administration.voteProposals.deleteProposal" />
  </Tooltip>
);

export const deleteGaugeTooltip = (
  <Tooltip id="deleteGaugeTooltip">
    <Translate value="administration.deleteGauge" />
  </Tooltip>
);

export const upTooltip = (
  <Tooltip id="upTooltip">
    <Translate value="administration.up" />
  </Tooltip>
);

export const downTooltip = (
  <Tooltip id="downTooltip">
    <Translate value="administration.down" />
  </Tooltip>
);

export const addThematicTooltip = ({ level }: TooltipProps) => (
  <Tooltip id="addThematicTooltip">
    <Translate value="administration.addThematic" level={level} />
  </Tooltip>
);

export const addQuestionTooltip = () => (
  <Tooltip id="addQuestionTooltip">
    <Translate value="administration.addQuestion" />
  </Tooltip>
);

export const deleteQuestionTooltip = () => (
  <Tooltip id="deleteQuestionTooltip">
    <Translate value="administration.deleteQuestion" />
  </Tooltip>
);

export const deleteThematicTooltip = () => (
  <Tooltip id="deleteThematicTooltip">
    <Translate value="administration.deleteThematic" />
  </Tooltip>
);

export const deleteSubThematicDisabledTooltip = () => (
  <Tooltip id="deleteSubThematicDisabledTooltip">
    <Translate value="administration.deleteSubThematicDisabled" />
  </Tooltip>
);

export const thematicTitle = (title: string) => <Tooltip id="thematicTitle">{title}</Tooltip>;

export const languageTooltip = (
  <Tooltip id="languageTooltip">
    <Translate value="administration.changeLanguage" />
  </Tooltip>
);

export const answerTooltip = (
  <Tooltip id="answerTooltip">
    <Translate value="debate.toAnswer" />
  </Tooltip>
);

export const sharePostTooltip = (
  <Tooltip id="sharePostTooltip">
    <Translate value="debate.sharePost" />
  </Tooltip>
);

export const shareSynthesisTooltip = (
  <Tooltip id="shareSynthesisTooltip">
    <Translate value="debate.shareSynthesis" />
  </Tooltip>
);

export const likeTooltip = (
  <Tooltip id="likeTooltip">
    <Translate value="debate.agree" />
  </Tooltip>
);

export const disagreeTooltip = (
  <Tooltip id="disagreeTooltip">
    <Translate value="debate.disagree" />
  </Tooltip>
);

export const dontUnderstandTooltip = (
  <Tooltip id="dontUnderstandTooltip">
    <Translate value="debate.dontUnderstand" />
  </Tooltip>
);

export const moreInfoTooltip = (
  <Tooltip id="moreInfoTooltip">
    <Translate value="debate.moreInfo" />
  </Tooltip>
);

export const deleteMessageTooltip = (
  <Tooltip id="deleteMessageTooltip">
    <Translate value="debate.deleteMessage" />
  </Tooltip>
);

export const deniedMessageTooltip = (
  <Tooltip id="deniedMessageTooltip">
    <Translate value="debate.deniedMessage" />
  </Tooltip>
);

export const editMessageTooltip = (
  <Tooltip id="editMessageTooltip">
    <Translate value="debate.editMessage" />
  </Tooltip>
);

export const validateMessageTooltip = (
  <Tooltip id="editMessageTooltip">
    <Translate value="debate.validateMessage" />
  </Tooltip>
);

export const createResourceTooltip = () => (
  <Tooltip id="createResourceTooltip">
    <Translate value="administration.resourcesCenter.createResource" />
  </Tooltip>
);

export const deleteResourceTooltip = () => (
  <Tooltip id="deleteResourceTooltip">
    <Translate value="administration.resourcesCenter.deleteResource" />
  </Tooltip>
);

export const resetTokensTooltip = (
  <Tooltip id="resetTokensTooltip">
    <Translate value="debate.voteSession.resetTokens" />
  </Tooltip>
);

export const hiddenTooltip = <Tooltip id="hiddenTooltip" style={{ display: 'none' }} />;

export const notEnoughTokensTooltip = (
  <Tooltip id="notEnoughTokensTooltip">
    <Translate value="debate.voteSession.notEnoughTokens" />
  </Tooltip>
);

export const exclusiveTokensTooltip = (
  <Tooltip id="exclusiveTokensTooltip">
    <Translate value="debate.voteSession.exclusiveTokens" />
  </Tooltip>
);

export const nextStepTooltip = (
  <Tooltip id="nextStepTooltip">
    <Translate value="administration.nextStep" />
  </Tooltip>
);

export const previousStepTooltip = (
  <Tooltip id="previousStepTooltip">
    <Translate value="administration.previousStep" />
  </Tooltip>
);

export const validateExtractTooltip = (
  <Tooltip id="validateExtractTooltip">
    <Translate value="harvesting.validateExtract" />
  </Tooltip>
);

export const editExtractTooltip = (
  <Tooltip id="editExtractTooltip">
    <Translate value="harvesting.editExtract" />
  </Tooltip>
);

export const deleteExtractTooltip = (
  <Tooltip id="deleteExtractTooltip">
    <Translate value="harvesting.deleteExtract" />
  </Tooltip>
);

export const nuggetExtractTooltip = (
  <Tooltip id="nuggetExtractTooltip">
    <Translate value="harvesting.nuggetExtract" />
  </Tooltip>
);

export const qualifyExtractTooltip = (
  <Tooltip id="qualifyExtractTooltip">
    <Translate value="harvesting.qualifyExtract" />
  </Tooltip>
);

export const harvestingTooltip = (
  <Tooltip id="harvestingTooltip">
    <Translate value="harvesting.harvesting" />
  </Tooltip>
);

export const editTagTooltip = (tag: string) => (
  <Tooltip id="editTagTooltip">
    <Translate value="harvesting.tags.edit" tag={tag} />
  </Tooltip>
);

export const deleteFileTooltip = (
  <Tooltip id="deleteFileTooltip">
    <Translate value="administration.deleteAssociatedFile" />
  </Tooltip>
);

export const deleteThematicImageTooltip = (
  <Tooltip id="deleteThematicImageTooltip">
    <Translate value="administration.deleteThematicImage" />
  </Tooltip>
);

export const addTextFieldTooltip = (
  <Tooltip id="addTextFieldTooltip">
    <Translate value="administration.profileOptions.addTextField" />
  </Tooltip>
);

export const hideTextFieldTooltip = (
  <Tooltip id="hideTextFieldTooltip">
    <Translate value="administration.profileOptions.hideTextField" />
  </Tooltip>
);

export const addSelectFieldOptionTooltip = (
  <Tooltip id="addSelectFieldTooltip">
    <Translate value="administration.profileOptions.addSelectFieldOption" />
  </Tooltip>
);

export const deleteTextFieldTooltip = (
  <Tooltip id="deleteTextFieldTooltip">
    <Translate value="administration.profileOptions.deleteTextField" />
  </Tooltip>
);

export const deleteSelectFieldOptionTooltip = (
  <Tooltip id="deleteSelectFieldOptionTooltip">
    <Translate value="administration.profileOptions.deleteSelectFieldOption" />
  </Tooltip>
);

export const textFieldToggleOptionalTooltip = (
  <Tooltip id="textFieldToggleOptionalTooltip">
    <Translate value="administration.profileOptions.textFieldToggleOptional" />
  </Tooltip>
);
export const textFieldToggleRequiredTooltip = (
  <Tooltip id="textFieldToggleRequiredTooltip">
    <Translate value="administration.profileOptions.textFieldToggleRequired" />
  </Tooltip>
);

export const addPhaseTooltip = () => (
  <Tooltip id="addPhaseTooltip">
    <Translate value="administration.timelineAdmin.addPhase" />
  </Tooltip>
);

export const deletePhaseTooltip = () => (
  <Tooltip id="deletePhaseTooltip">
    <Translate value="administration.timelineAdmin.deletePhase" />
  </Tooltip>
);

export const thematicTooltip = (title: string) => <Tooltip id="thematicTooltip">{title}</Tooltip>;

export const editFictionTooltip = (
  <Tooltip id="editFictionTooltip">
    <Translate value="debate.brightMirror.editFiction" />
  </Tooltip>
);

export const deleteFictionTooltip = (
  <Tooltip id="deleteFictionTooltip">
    <Translate value="debate.brightMirror.deleteFiction" />
  </Tooltip>
);

export const shareFictionTooltip = (
  <Tooltip id="shareFictionTooltip">
    <Translate value="debate.brightMirror.shareFiction" />
  </Tooltip>
);

export const editFictionCommentTooltip = (
  <Tooltip id="editFictionCommentTooltip">
    <Translate value="debate.brightMirror.commentFiction.editComment" />
  </Tooltip>
);

export const deleteFictionCommentTooltip = (
  <Tooltip id="deleteFictionCommentTooltip">
    <Translate value="debate.brightMirror.commentFiction.deleteComment" />
  </Tooltip>
);

export const editSideCommentTooltip = (
  <Tooltip id="editFictionCommentTooltip">
    <Translate value="debate.brightMirror.sideComment.editTooltip" />
  </Tooltip>
);

export const deleteSideCommentTooltip = (
  <Tooltip id="editFictionCommentTooltip">
    <Translate value="debate.brightMirror.sideComment.deleteTooltip" />
  </Tooltip>
);

export const fictionLikeTooltip = (
  <Tooltip id="fictionLikeTooltip">
    <Translate value="debate.brightMirror.sentiment.like" />
  </Tooltip>
);

export const fictionDislikeTooltip = (
  <Tooltip id="fictionDislikeTooltip">
    <Translate value="debate.brightMirror.sentiment.dislike" />
  </Tooltip>
);

export const fictionDontUnderstandTooltip = (
  <Tooltip id="fictionDontUnderstandTooltip">
    <Translate value="debate.brightMirror.sentiment.dontUnderstand" />
  </Tooltip>
);

export const fictionMoreInfoTooltip = (
  <Tooltip id="fictionMoreInfoTooltip">
    <Translate value="debate.brightMirror.sentiment.moreInfo" />
  </Tooltip>
);

export const commentHelperButtonTooltip = (
  <Tooltip id="commentHelperButtonTooltip">
    <Translate value="debate.brightMirror.commentFiction.commentHelper" />
  </Tooltip>
);

export const titleTooltip = (content: React.Node) => (
  <Tooltip id="titleTooltip" className="title-tooltip">
    {content}
  </Tooltip>
);

export const editSynthesisTooltip = (
  <Tooltip id="editSynthesisTooltip">
    <Translate value="debate.syntheses.editSynthesisTooltip" />
  </Tooltip>
);

export const deleteSynthesisTooltip = (
  <Tooltip id="deleteSynthesisTooltip">
    <Translate value="debate.syntheses.deleteSynthesisTooltip" />
  </Tooltip>
);

export const editModuleTooltip = (
  <Tooltip id="editModuleTooltip">
    <Translate value="administration.modules.edit" />
  </Tooltip>
);

export const removeModuleTooltip = (
  <Tooltip id="removeModuleTooltip">
    <Translate value="administration.modules.remove" />
  </Tooltip>
);

export const disableModuleTooltip = (
  <Tooltip id="disableModuleTooltip">
    <Translate value="administration.modules.disable" />
  </Tooltip>
);

export const enableModuleTooltip = (
  <Tooltip id="enableModuleTooltip">
    <Translate value="administration.modules.enable" />
  </Tooltip>
);