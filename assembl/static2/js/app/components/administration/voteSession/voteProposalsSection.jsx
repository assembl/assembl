// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { addVoteProposalTooltip } from '../../common/tooltips';
import { createVoteProposal } from '../../../actions/adminActions/voteSession';
import SectionTitle from '../sectionTitle';
import VoteProposalForm from './voteProposalForm';

type VoteProposalsSectionProps = {
  voteProposals: Object,
  editLocale: string,
  addVoteProposal: Function
};

const VoteProposalsSection = ({ voteProposals, editLocale, addVoteProposal }: VoteProposalsSectionProps) => (
  <div className="vote-proposals-section">
    <div className="admin-box">
      <SectionTitle
        title="Configurer les propositions associées aux modules de vote"
        annotation={I18n.t('administration.annotation')}
      />
      <div className="intro-text bold">{I18n.t('administration.voteProposals.introText1')}</div>
      <div className="intro-text">{I18n.t('administration.voteProposals.introText2')}</div>
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
  const { voteProposalsInOrder, voteProposalsById } = admin.voteSession;
  const { editLocale } = admin;
  return {
    voteProposals: voteProposalsInOrder.filter(id => !voteProposalsById.getIn([id, 'toDelete'])),
    editLocale: editLocale
  };
};

const mapDispatchToProps = dispatch => ({
  addVoteProposal: () => {
    const newProposalId = Math.round(Math.random() * -1000000).toString();
    dispatch(createVoteProposal(newProposalId));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(VoteProposalsSection);