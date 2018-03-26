// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { OverlayTrigger, Button, Checkbox, FormGroup, HelpBlock } from 'react-bootstrap';
import { type RawContentState } from 'draft-js';

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
  cancelModuleCustomization,
  deleteVoteModule,
  undeleteModule
} from '../../../actions/adminActions/voteSession';
import { displayCustomModal, displayModal, closeModal } from '../../../utils/utilityManager';
import { createRandomId } from '../../../utils/globalFunctions';
import CustomizeGaugeForm from './customizeGaugeForm';

type VoteProposalFormProps = {
  index: number,
  title: string,
  description: RawContentState,
  _toDelete: boolean,
  markAsToDelete: Function,
  updateTitle: Function,
  updateDescription: Function,
  editLocale: string,
  nbProposals: number,
  handleUpClick: Function,
  handleDownClick: Function,
  associateModuleToProposal: Function,
  cancelCustomization: Function,
  deassociateModuleToProposal: Function,
  reactivateModule: Function,
  tokenModules: Object,
  gaugeModules: Object,
  proposalModules: Object,
  refetchVoteSession: Function,
  validationErrors: ValidationErrors
};

export const getValidationState = (validationErrors: ?Array<ErrorDef>): ?string =>
  (validationErrors && validationErrors.length > 0 ? 'error' : null);

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
  cancelCustomization,
  deassociateModuleToProposal,
  reactivateModule,
  refetchVoteSession,
  validationErrors
}: VoteProposalFormProps) => {
  if (_toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);
  const handleDescriptionChange = value => updateDescription(editLocale, value);

  const moduleIsSelected = voteSpecTemplateId =>
    proposalModules.some(m => m.get('voteSpecTemplateId') === voteSpecTemplateId && !m.get('_toDelete'));

  const toggleModule = (voteSpecTemplateId) => {
    const pModule = proposalModules.find(m => m.get('voteSpecTemplateId') === voteSpecTemplateId);
    if (pModule) {
      if (pModule.get('_toDelete')) {
        reactivateModule(pModule.get('id'));
      } else {
        deassociateModuleToProposal(pModule.get('id'));
      }
    } else {
      associateModuleToProposal(voteSpecTemplateId);
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
    const content = (
      <CustomizeGaugeForm close={closeModal} gaugeModuleId={id} editLocale={editLocale} refetchVoteSession={refetchVoteSession} />
    );
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
            <Button className="admin-icons" onClick={confirmModal}>
              <span className="assembl-icon-delete grey" />
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
        validationErrors={validationErrors.title}
      />

      <FormControlWithLabel
        key={`description-${editLocale}`}
        value={description}
        label={I18n.t('administration.voteProposals.description')}
        onChange={handleDescriptionChange}
        type="rich-text"
        required
      />

      <FormGroup validationState={getValidationState(validationErrors.modules)}>
        {validationErrors.modules &&
          validationErrors.modules.length > 0 &&
          validationErrors.modules.map((error, idx) => (
            <HelpBlock key={idx}>
              <Translate value={`administration.voteProposals.validationErrors.${error.code}`} {...error.vars} />
            </HelpBlock>
          ))}

        {tokenModules.map(voteSpecTemplateId => (
          <Checkbox
            key={voteSpecTemplateId}
            checked={moduleIsSelected(voteSpecTemplateId)}
            onChange={() => toggleModule(voteSpecTemplateId)}
          >
            <Translate value="administration.voteProposals.tokenVote" />
          </Checkbox>
        ))}
        {gaugeModules.map((voteSpecTemplateId, idx) => {
          const number = gaugeModules.size > 1 ? idx + 1 : '';
          const pModule = proposalModules.find(m => m.get('voteSpecTemplateId') === voteSpecTemplateId);
          return (
            <div key={voteSpecTemplateId}>
              <Checkbox
                className="inline"
                checked={moduleIsSelected(voteSpecTemplateId)}
                onChange={() => toggleModule(voteSpecTemplateId)}
              >
                {pModule && pModule.get('isCustom') ? (
                  <Translate value="administration.voteProposals.customGauge" number={number} />
                ) : (
                  <Translate value="administration.voteProposals.gauge" number={number} />
                )}
              </Checkbox>

              {pModule &&
                pModule.get('id') && (
                  <div>
                    <span
                      className="inline settings-link"
                      onClick={() => {
                        settingsModal(pModule.get('id'));
                      }}
                    >
                      <i className="assembl-icon-edit" />
                      <Translate value="administration.voteProposals.gaugeSettings" />
                    </span>

                    {pModule.get('isCustom') && (
                      <span
                        className="inline settings-link"
                        onClick={() => {
                          cancelCustomization(pModule.get('id'));
                        }}
                      >
                        <i className="assembl-icon-cancel" />
                        <Translate value="administration.voteProposals.cancelCustomization" />
                      </span>
                    )}
                  </div>
                )}
            </div>
          );
        })}
      </FormGroup>
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = ({ admin }, { id, editLocale }) => {
  const proposal = admin.voteSession.voteProposalsById.get(id);
  const { modulesInOrder, modulesById } = admin.voteSession;
  const description = getEntryValueForLocale(proposal.get('descriptionEntries'), editLocale);
  return {
    _toDelete: proposal.get('_toDelete', false),
    validationErrors: proposal.get('_validationErrors'),
    title: getEntryValueForLocale(proposal.get('titleEntries'), editLocale),
    description: description && typeof description !== 'string' ? description.toJS() : null,
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
  cancelCustomization: moduleId => dispatch(cancelModuleCustomization(moduleId)),
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