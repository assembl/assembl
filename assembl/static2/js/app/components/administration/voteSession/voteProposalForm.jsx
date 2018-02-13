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
  moveProposalDown
} from '../../../actions/adminActions/voteSession';

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
  tokenModules: Object,
  gaugeModules: Object
};

const VoteProposalForm = ({
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
  gaugeModules
}: VoteProposalFormProps) => {
  if (toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);
  const handleDescriptionChange = value => updateDescription(editLocale, value);
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
        <OverlayTrigger placement="top" overlay={deleteVoteProposalTooltip}>
          <Button onClick={markAsToDelete} className="admin-icons">
            <span className="assembl-icon-delete grey" />
          </Button>
        </OverlayTrigger>
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
      {tokenModules.map(moduleId => (
        <Checkbox key={moduleId} checked onChange={() => {}}>
          <Translate value="administration.voteProposals.tokenVote" />
        </Checkbox>
      ))}
      {gaugeModules.map((moduleId, idx) => {
        const number = gaugeModules.size > 1 ? idx + 1 : '';
        return (
          <div key={moduleId}>
            <Checkbox className="inline" checked onChange={() => {}}>
              <Translate value="administration.voteProposals.gauge" number={number} />
            </Checkbox>
            <span
              className="inline settings-link"
              onClick={() => {
                /* OPEN THE SETTINGS MODAL */
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
    tokenModules: modulesInOrder.filter(
      moduleId => modulesById.getIn([moduleId, 'type']) === 'tokens' && !modulesById.getIn([id, 'toDelete'])
    ),
    gaugeModules: modulesInOrder.filter(
      moduleId => modulesById.getIn([moduleId, 'type']) === 'gauge' && !modulesById.getIn([id, 'toDelete'])
    )
  };
};

const mapDispatchToProps = (dispatch, { id }) => ({
  markAsToDelete: () => {
    dispatch(deleteVoteProposal(id));
  },
  updateTitle: (locale, value) => {
    dispatch(updateVoteProposalTitle(id, locale, value));
  },
  updateDescription: (locale, value) => {
    dispatch(updateVoteProposalDescription(id, locale, value));
  },
  handleUpClick: () => dispatch(moveProposalUp(id)),
  handleDownClick: () => dispatch(moveProposalDown(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(VoteProposalForm);