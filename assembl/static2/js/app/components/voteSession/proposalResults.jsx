// @flow
import * as React from 'react';
import { Col, Row } from 'react-bootstrap';

import { ChoiceGaugeVoteForProposal, NumberGaugeVoteForProposal } from './gaugeVoteForProposal';
import TokenVotesResults from './tokenVotesResults';
import ParticipantsCount from './participantsCount';
import {
  findTokenVoteModule,
  filterGaugeVoteModules,
  filterNumberGaugeVoteModules,
  type VoteSpecification
} from '../../pages/voteSession';

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
          <Col xs={12} md={5} className="margin-s">
            <h3 className="proposal-title dark-title-3">{title}</h3>
            <div className="text" dangerouslySetInnerHTML={{ __html: description }} />
            <ParticipantsCount count={numParticipants} />
          </Col>
          <Col xs={12} mdOffset={1} md={6} className="proposal-vote-modules">
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
              filterGaugeVoteModules(modules).map(module => (
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
              ))}

            {modules &&
              filterNumberGaugeVoteModules(modules).map(module => (
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
              ))}
          </Col>
        </Row>
      </div>
    );
  }
}

export default ProposalResults;