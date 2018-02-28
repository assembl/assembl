// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { Link } from 'react-router';
import { addVoteProposalTooltip } from '../../common/tooltips';
import { createVoteProposalAndModules } from '../../../actions/adminActions/voteSession';
import SectionTitle from '../sectionTitle';
import VoteProposalForm from './voteProposalForm';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { get } from '../../../utils/routeMap';

type VoteProposalsSectionProps = {
  voteProposals: Object,
  editLocale: string,
  addVoteProposal: Function
};

const DumbVoteProposalsSection = ({ voteProposals, editLocale, addVoteProposal }: VoteProposalsSectionProps) => {
  const slug = { slug: getDiscussionSlug() };
  return (
    <div className="vote-proposals-section">
      <div className="admin-box">
        <SectionTitle
          title={I18n.t('administration.voteProposals.sectionTitle')}
          annotation={I18n.t('administration.annotation')}
        />
        <div className="intro-text">
          <Translate className="bold" value="administration.voteModulesIntroText1" />
          <div className="inline">
            <Translate value="administration.voteModulesIntroText2" />
            <Link to={`${get('oldDebate', slug)}/timeline`} className="timeline-link" target="_blank">
              <Translate value="administration.timeline" />
            </Link>.
          </div>
        </div>
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
};

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
    dispatch(createVoteProposalAndModules(newProposalId));
  }
});

export { DumbVoteProposalsSection };

export default connect(mapStateToProps, mapDispatchToProps)(DumbVoteProposalsSection);