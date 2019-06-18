// @flow
import * as React from 'react';
import { Col, Row } from 'react-bootstrap';

import { ChoiceGaugeVoteForProposal, NumberGaugeVoteForProposal } from './gaugeVoteForProposal';
import TokenVotesResults from './tokenVotesResults';
import ParticipantsCount from './participantsCount';
import { findTokenVoteModule, filterGaugeVoteModules, type VoteSpecification } from '../../pages/voteSession';

type Props = {
  description: ?string,
  id: string,
  modules: Array<VoteSpecification>,
  numParticipants: number,
  title: ?string
};

class ProposalResults extends React.Component<Props> {
  render() {
    const { description, id, modules, numParticipants, title } = this.props;
    const tokenVoteModule = modules ? findTokenVoteModule(modules) : null;
    const tokenCategories = tokenVoteModule ? tokenVoteModule.tokenCategories : [];
    return (
      <div className="proposal-results theme-box">
        <Row className="proposal">
          <Col xs={12} md={7} className="margin-s">
            <h3 className="proposal-title dark-title-3">{title}</h3>
            <div className="text" dangerouslySetInnerHTML={{ __html: description }} />
            <ParticipantsCount count={numParticipants} />
          </Col>
          <Col xs={12} md={5} className="proposal-vote-modules">
            {tokenVoteModule &&
              tokenCategories.length > 0 && (
                <TokenVotesResults
                  categories={tokenCategories}
                  tokenVotes={tokenVoteModule.tokenVotes}
                  numVotes={tokenVoteModule.numVotes}
                  titleMsgId="debate.voteSession.tokenDistribution"
                />
              )}

            {modules &&
              filterGaugeVoteModules(modules).map((module) => {
                if (module.voteType === 'gauge_vote_specification') {
                  return (
                    <div key={`${id}-GaugeVoteForProposal-${module.id}`}>
                      <ChoiceGaugeVoteForProposal
                        id={module.id}
                        disabled
                        instructions={module.instructions}
                        choices={module.choices}
                        proposalId={id}
                        value={module.averageResult}
                      />
                    </div>
                  );
                } else if (module.voteType === 'number_gauge_vote_specification') {
                  return (
                    <div key={`${id}-NumberGaugeVoteForProposal-${module.id}`}>
                      <NumberGaugeVoteForProposal
                        id={module.id}
                        disabled
                        instructions={module.instructions}
                        minimum={module.minimum}
                        maximum={module.maximum}
                        nbTicks={module.nbTicks}
                        unit={module.unit}
                        proposalId={id}
                        value={module.averageResult}
                      />
                    </div>
                  );
                }
                return null;
              })}
          </Col>
        </Row>
      </div>
    );
  }
}

export default ProposalResults;