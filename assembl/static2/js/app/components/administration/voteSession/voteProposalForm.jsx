import React from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Button } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { deleteVoteProposalTooltip } from '../../common/tooltips';

const VoteProposalForm = ({
  index,
  title,
  description,
  toDelete,
  markAsToDelete,
  updateTitle,
  updateDescription,
  editLocale
}) => {
  if (toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);
  const handleDescriptionChange = e => updateDescription(editLocale, e.target.value);

  return (
    <div className="form-container">
      <div className="pointer right">
        <div className="inline">
          <OverlayTrigger placement="top" overlay={deleteVoteProposalTooltip}>
            <Button onClick={markAsToDelete} className="admin-icons">
              <span className="assembl-icon-delete grey" />
            </Button>
          </OverlayTrigger>
        </div>
      </div>
      <div className="title">Définir proposition {index + 1}</div>
      <FormControlWithLabel value={title} label="Titre de la proposition" onChange={handleTitleChange} required type="text" />
      <FormControlWithLabel
        value={description}
        label="Description de la proposition"
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

const mapDispatchToProps = () => ({
  markAsToDelete: () => {},
  updateTitle: () => {},
  updateDescription: () => {}
});

export default connect(mapStateToProps, mapDispatchToProps)(VoteProposalForm);