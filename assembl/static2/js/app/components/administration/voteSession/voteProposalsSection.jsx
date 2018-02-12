import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { addPropositionTooltip } from '../../common/tooltips';
import SectionTitle from '../sectionTitle';
import VoteProposalForm from './voteProposalForm';

const VoteProposalsSection = ({ voteProposals, editLocale, addVoteProposal }) => (
  <div className="admin-box">
    <SectionTitle
      title="Configurer les propositions associées aux modules de vote"
      annotation={I18n.t('administration.annotation')}
    />
    <div className="admin-content">
      <form>
        {voteProposals.map((id, index) => <VoteProposalForm key={id} id={id} index={index} editLocale={editLocale} />)}
        <OverlayTrigger placement="top" overlay={addPropositionTooltip}>
          <div onClick={addVoteProposal} className="plus margin-l">
              +
          </div>
        </OverlayTrigger>
      </form>
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

const mapDispatchToProps = () => ({
  addVoteProposal: () => {}
});

export default connect(mapStateToProps, mapDispatchToProps)(VoteProposalsSection);