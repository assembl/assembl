// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { OverlayTrigger, Button, Checkbox } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { deleteVoteProposalTooltip, upTooltip, downTooltip } from '../../common/tooltips';
import {
  updateVoteProposalTitle,
  updateVoteProposalDescription,
  deleteVoteProposal,
  moveProposalUp,
  moveProposalDown,
  addModuleToProposal,
  deleteModuleFromProposal
} from '../../../actions/adminActions/voteSession';
import { displayModal, displayCustomModal, closeModal } from '../../../utils/utilityManager';
import GaugeSettingsForm from './gaugeSettingsForm';

type VoteProposalFormProps = {
  index: number,
  title: string,
  description: string,
  toDelete: boolean,
  markAsToDelete: Function,
  updateTitle: Function,
  updateDescription: Function,
  editLocale: string,
  nbProposals: number,
  handleUpClick: Function,
  handleDownClick: Function,
  associateModuleToProposal: Function,
  deassociateModuleToProposal: Function,
  tokenModules: Object,
  gaugeModules: Object,
  proposalModules: Object
};

const DumbVoteProposalForm = ({
  index,
  title,
  description,
  toDelete,
  markAsToDelete,
  updateTitle,
  updateDescription,
  editLocale,
  nbProposals,
  handleUpClick,
  handleDownClick,
  tokenModules,
  gaugeModules,
  proposalModules,
  associateModuleToProposal,
  deassociateModuleToProposal
}: VoteProposalFormProps) => {
  if (toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);
  const handleDescriptionChange = value => updateDescription(editLocale, value);

  const confirmModal = () => {
    const modalTitle = <Translate value="administration.voteProposals.deleteModalTitle" />;
    const body = <Translate value="administration.voteProposals.deleteModalBody" />;
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="debate.confirmDeletionButtonCancel" />
      </Button>,
      <Button key="delete" onClick={markAsToDelete} className="button-submit button-dark">
        <Translate value="debate.confirmDeletionButtonDelete" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(modalTitle, body, includeFooter, footer);
  };

  const settingsModal = (id) => {
    const content = <GaugeSettingsForm gaugeModuleId={id} editLocale={editLocale} />;
    displayCustomModal(content, true, 'gauge-settings-modal');
  };

  return (
    <div className="form-container vote-proposal-form">
      <div className="pointer right">
        <div className="inline">
          {index < nbProposals ? (
            <OverlayTrigger placement="top" overlay={downTooltip}>
              <Button onClick={handleDownClick} className="admin-icons">
                <span className="assembl-icon-down-bold grey" />
              </Button>
            </OverlayTrigger>
          ) : null}
          {index > 1 ? (
            <OverlayTrigger placement="top" overlay={upTooltip}>
              <Button onClick={handleUpClick} className="admin-icons">
                <span className="assembl-icon-up-bold grey" />
              </Button>
            </OverlayTrigger>
          ) : null}
        </div>
        {nbProposals > 2 && (
          <OverlayTrigger placement="top" overlay={deleteVoteProposalTooltip}>
            <Button className="admin-icons">
              <span className="assembl-icon-delete grey" onClick={confirmModal} />
            </Button>
          </OverlayTrigger>
        )}
      </div>
      <div className="title">
        <Translate value="administration.voteProposals.defineProposal" number={index} />
      </div>
      <FormControlWithLabel
        value={title}
        label={I18n.t('administration.voteProposals.title')}
        onChange={handleTitleChange}
        required
        type="text"
      />
      <FormControlWithLabel
        value={description}
        label={I18n.t('administration.voteProposals.description')}
        onChange={handleDescriptionChange}
        type="rich-text"
        required
      />
      {tokenModules.map((moduleTemplateId) => {
        const isChecked = proposalModules.some(m => m.get('voteSpecTemplateId') === moduleTemplateId);
        return (
          <Checkbox
            key={moduleTemplateId}
            checked={isChecked}
            onChange={() => {
              if (isChecked) {
                const pModule = proposalModules.find(m => m.get('voteSpecTemplateId') === moduleTemplateId);
                deassociateModuleToProposal(pModule.get('id'));
              } else {
                associateModuleToProposal(moduleTemplateId);
              }
            }}
          >
            <Translate value="administration.voteProposals.tokenVote" />
          </Checkbox>
        );
      })}
      {gaugeModules.map((moduleTemplateId, idx) => {
        const isChecked = proposalModules.some(m => m.get('voteSpecTemplateId') === moduleTemplateId);
        const number = gaugeModules.size > 1 ? idx + 1 : '';
        return (
          <div key={moduleTemplateId}>
            <Checkbox
              className="inline"
              checked={isChecked}
              onChange={() => {
                if (isChecked) {
                  const pModule = proposalModules.find(m => m.get('voteSpecTemplateId') === moduleTemplateId);
                  deassociateModuleToProposal(pModule.get('id'));
                } else {
                  associateModuleToProposal(moduleTemplateId);
                }
              }}
            >
              <Translate value="administration.voteProposals.gauge" number={number} />
            </Checkbox>
            <span
              className="inline settings-link"
              onClick={() => {
                settingsModal(moduleTemplateId);
              }}
            >
              <i className="assembl-icon-edit" />
              <Translate value="administration.voteProposals.gaugeSettings" />
            </span>
          </div>
        );
      })}
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = ({ admin }, { id, editLocale }) => {
  const proposal = admin.voteSession.voteProposalsById.get(id);
  const { modulesInOrder, modulesById } = admin.voteSession;
  const description = getEntryValueForLocale(proposal.get('descriptionEntries'), editLocale);
  return {
    title: getEntryValueForLocale(proposal.get('titleEntries'), editLocale),
    description: description ? description.toJS() : null,
    toDelete: proposal.get('toDelete', false),
    order: proposal.get('order'),
    proposalModules: proposal
      .get('modules')
      .map(moduleId => modulesById.get(moduleId))
      .filter(m => !m.get('toDelete')),
    tokenModules: modulesInOrder.filter(
      voteSpecTemplateId =>
        !modulesById.getIn([voteSpecTemplateId, 'proposalId']) &&
        modulesById.getIn([voteSpecTemplateId, 'type']) === 'tokens' &&
        !modulesById.getIn([voteSpecTemplateId, 'toDelete'])
    ),
    gaugeModules: modulesInOrder.filter(
      voteSpecTemplateId =>
        !modulesById.getIn([voteSpecTemplateId, 'proposalId']) &&
        modulesById.getIn([voteSpecTemplateId, 'type']) === 'gauge' &&
        !modulesById.getIn([voteSpecTemplateId, 'toDelete'])
    )
  };
};

const mapDispatchToProps = (dispatch, { id }) => ({
  markAsToDelete: () => {
    dispatch(deleteVoteProposal(id));
    closeModal();
  },
  updateTitle: (locale, value) => {
    dispatch(updateVoteProposalTitle(id, locale, value));
  },
  updateDescription: (locale, value) => {
    dispatch(updateVoteProposalDescription(id, locale, value));
  },
  handleUpClick: () => dispatch(moveProposalUp(id)),
  handleDownClick: () => dispatch(moveProposalDown(id)),
  associateModuleToProposal: (voteSpecTemplateId) => {
    const newId = Math.round(Math.random() * -1000000).toString();
    dispatch(addModuleToProposal(newId, id, voteSpecTemplateId));
  },
  deassociateModuleToProposal: moduleId => dispatch(deleteModuleFromProposal(id, moduleId))
});

export { DumbVoteProposalForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbVoteProposalForm);