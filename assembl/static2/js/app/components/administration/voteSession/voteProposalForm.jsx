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
  deleteVoteModule,
  undeleteModule
} from '../../../actions/adminActions/voteSession';
import { displayCustomModal, displayModal, closeModal } from '../../../utils/utilityManager';
import { createRandomId } from '../../../utils/globalFunctions';
import CustomizeGaugeForm from './customizeGaugeForm';

type VoteProposalFormProps = {
  index: number,
  title: string,
  description: string,
  _toDelete: boolean,
  markAsToDelete: Function,
  updateTitle: Function,
  updateDescription: Function,
  editLocale: string,
  nbProposals: number,
  handleUpClick: Function,
  handleDownClick: Function,
  associateModuleToProposal: Function,
  deassociateModuleToProposal: Function,
  reactivateModule: Function,
  tokenModules: Object,
  gaugeModules: Object,
  proposalModules: Object
};

const DumbVoteProposalForm = ({
  index,
  title,
  description,
  _toDelete,
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
  deassociateModuleToProposal,
  reactivateModule
}: VoteProposalFormProps) => {
  if (_toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);
  const handleDescriptionChange = value => updateDescription(editLocale, value);

  const moduleIsSelected = moduleTemplateId =>
    proposalModules.some(m => m.get('voteSpecTemplateId') === moduleTemplateId && !m.get('_toDelete'));

  const toggleModule = (moduleTemplateId) => {
    const pModule = proposalModules.find(m => m.get('voteSpecTemplateId') === moduleTemplateId);
    if (pModule) {
      if (pModule.get('_toDelete')) {
        reactivateModule(pModule.get('id'));
      } else {
        deassociateModuleToProposal(pModule.get('id'));
      }
    } else {
      associateModuleToProposal(moduleTemplateId);
    }
  };

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
    const content = <CustomizeGaugeForm gaugeModuleId={id} editLocale={editLocale} />;
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
      {tokenModules.map(moduleTemplateId => (
        <Checkbox
          key={moduleTemplateId}
          checked={moduleIsSelected(moduleTemplateId)}
          onChange={() => toggleModule(moduleTemplateId)}
        >
          <Translate value="administration.voteProposals.tokenVote" />
        </Checkbox>
      ))}
      {gaugeModules.map((moduleTemplateId, idx) => {
        const number = gaugeModules.size > 1 ? idx + 1 : '';
        const pModule = proposalModules.find(m => m.get('voteSpecTemplateId') === moduleTemplateId);
        return (
          <div key={moduleTemplateId}>
            <Checkbox
              className="inline"
              checked={moduleIsSelected(moduleTemplateId)}
              onChange={() => toggleModule(moduleTemplateId)}
            >
              <Translate value="administration.voteProposals.gauge" number={number} />
            </Checkbox>

            {/* disable gaugeSettings for now */}
            {false &&
              pModule &&
              pModule.get('id') && (
                <span
                  className="inline settings-link"
                  onClick={() => {
                    settingsModal(pModule.get('id'));
                  }}
                >
                  <i className="assembl-icon-edit" />
                  <Translate value="administration.voteProposals.gaugeSettings" />
                </span>
              )}
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
    _toDelete: proposal.get('_toDelete', false),
    order: proposal.get('order'),
    proposalModules: proposal.get('modules').map(moduleId => modulesById.get(moduleId)),
    tokenModules: modulesInOrder.filter(
      voteSpecTemplateId =>
        !modulesById.getIn([voteSpecTemplateId, 'proposalId']) &&
        modulesById.getIn([voteSpecTemplateId, 'type']) === 'tokens' &&
        !modulesById.getIn([voteSpecTemplateId, '_toDelete'])
    ),
    gaugeModules: modulesInOrder.filter(
      voteSpecTemplateId =>
        !modulesById.getIn([voteSpecTemplateId, 'proposalId']) &&
        modulesById.getIn([voteSpecTemplateId, 'type']) === 'gauge' &&
        !modulesById.getIn([voteSpecTemplateId, '_toDelete'])
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
    const newId = createRandomId();
    dispatch(addModuleToProposal(newId, id, voteSpecTemplateId));
  },
  deassociateModuleToProposal: moduleId => dispatch(deleteVoteModule(moduleId)),
  reactivateModule: moduleId => dispatch(undeleteModule(moduleId))
});

export { DumbVoteProposalForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbVoteProposalForm);