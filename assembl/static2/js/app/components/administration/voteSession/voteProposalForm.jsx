// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { OverlayTrigger, Button } from 'react-bootstrap';
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
  handleDownClick: Function
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
  handleDownClick
}: VoteProposalFormProps) => {
  if (toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);
  const handleDescriptionChange = e => updateDescription(editLocale, e.target.value);
  return (
    <div className="form-container">
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
        type="text"
        required
      />
    </div>
  );
};

const mapStateToProps = ({ admin }, { id, editLocale }) => {
  const proposal = admin.voteSession.voteProposalsById.get(id);
  return {
    title: getEntryValueForLocale(proposal.get('titleEntries'), editLocale),
    description: getEntryValueForLocale(proposal.get('descriptionEntries'), editLocale, ''),
    toDelete: proposal.get('toDelete', false)
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