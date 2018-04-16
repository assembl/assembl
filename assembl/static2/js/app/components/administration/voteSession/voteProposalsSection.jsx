// @flow
import React from 'react';
import { type List } from 'immutable';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';

import { addVoteProposalTooltip } from '../../common/tooltips';
import { createVoteProposalAndModules } from '../../../actions/adminActions/voteSession';
import SectionTitle from '../sectionTitle';
import VoteProposalForm from './voteProposalForm';
import { createRandomId } from '../../../utils/globalFunctions';

type VoteProposalsSectionProps = {
  addVoteProposal: Function,
  editLocale: string,
  voteProposals: List<string>
};

const DumbVoteProposalsSection = ({ addVoteProposal, editLocale, voteProposals }: VoteProposalsSectionProps) => (
  <div className="vote-proposals-section">
    <div className="admin-box">
      <SectionTitle
        title={I18n.t('administration.voteProposals.sectionTitle')}
        annotation={I18n.t('administration.annotation')}
      />
      <div className="admin-content">
        <form>
          {voteProposals.map((id, index) => (
            <VoteProposalForm key={id} id={id} index={index + 1} editLocale={editLocale} nbProposals={voteProposals.size} />
          ))}
          <OverlayTrigger placement="top" overlay={addVoteProposalTooltip}>
            <div onClick={addVoteProposal} className="plus margin-l">
              +
            </div>
          </OverlayTrigger>
        </form>
      </div>
    </div>
  </div>
);

const mapStateToProps = ({ admin }) => {
  const { voteProposalsById } = admin.voteSession;
  const { editLocale } = admin;
  return {
    voteProposals: voteProposalsById
      .filter(proposal => !proposal.get('_toDelete'))
      .sortBy(proposal => proposal.get('order'))
      .map(proposal => proposal.get('id'))
      .toList(),
    editLocale: editLocale
  };
};

const mapDispatchToProps = dispatch => ({
  addVoteProposal: () => {
    const newProposalId = createRandomId();
    dispatch(createVoteProposalAndModules(newProposalId));
  }
});

export { DumbVoteProposalsSection };

export default connect(mapStateToProps, mapDispatchToProps)(DumbVoteProposalsSection);