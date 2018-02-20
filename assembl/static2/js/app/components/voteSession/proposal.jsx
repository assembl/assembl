// @flow
import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Map } from 'immutable';

import TokenVoteForProposal from './tokenVoteForProposal';
import { GaugeVoteForProposal, NumberGaugeVoteForProposal } from './gaugeVoteForProposal';
import VotesInProgress from './votesInProgress';
import {
  findTokenVoteModule,
  filterGaugeVoteModules,
  filterNumberGaugeVoteModules,
  type RemainingTokensByCategory,
  type UserTokenVotes,
  type VoteSpecification
} from '../../pages/voteSession';

type Props = {
  description: ?string,
  id: string,
  modules: ?Array<VoteSpecification>,
  remainingTokensByCategory: RemainingTokensByCategory,
  title: ?string,
  tokenVotes: UserTokenVotes,
  voteForProposal: Function,
  voteForProposalGauge: Function
};

type State = {
  showVotesInProgress: boolean
};

class Proposal extends React.Component<void, Props, State> {
  props: Props;

  state: State;

  constructor() {
    super();
    this.state = {
      showVotesInProgress: false
    };
  }

  toggleShowVotesInProgress = () => {
    this.setState({
      showVotesInProgress: !this.state.showVotesInProgress
    });
  };

  render() {
    const {
      description,
      id,
      modules,
      remainingTokensByCategory,
      title,
      tokenVotes,
      voteForProposal,
      voteForProposalGauge
    } = this.props;
    const tokenVoteModule = modules ? findTokenVoteModule(modules) : null;
    return (
      <div className="theme-box">
        <Row className="proposal">
          <Col xs={12} md={5}>
            <h3 className="proposal-title dark-title-3">{title}</h3>
            <p className="text">{description}</p>
          </Col>
          <Col xs={12} md={7} className="proposal-vote-modules">
            {tokenVoteModule && (
              <TokenVoteForProposal
                key={`${id}-TokenVoteForProposal-${tokenVoteModule.id}`}
                instructions={tokenVoteModule.instructions}
                proposalId={id}
                remainingTokensByCategory={remainingTokensByCategory}
                tokenCategories={tokenVoteModule.tokenCategories}
                tokenVotes={tokenVotes.get(id, Map())}
                voteForProposal={voteForProposal}
              />
            )}

            {modules &&
              filterGaugeVoteModules(modules).map(module => (
                <GaugeVoteForProposal
                  key={`${id}-GaugeVoteForProposal-${module.id}`}
                  {...module}
                  voteForProposal={voteForProposalGauge}
                  proposalId={id}
                  value={0} // TODO: use myVotes
                />
              ))}

            {modules &&
              filterNumberGaugeVoteModules(modules).map(module => (
                <NumberGaugeVoteForProposal
                  key={`${id}-NumberGaugeVoteForProposal-${module.id}`}
                  minimum={module.minimum}
                  maximum={module.maximum}
                  nbTicks={module.nbTicks}
                  unit={module.unit}
                  instructions={module.instructions}
                  {...module}
                  voteForProposal={voteForProposalGauge}
                  proposalId={id}
                  value={0} // TODO: use myVotes
                />
              ))}
          </Col>
        </Row>
        <Row>
          <Col xs={12} md={12} className="center">
            {this.state.showVotesInProgress ? (
              <div>
                {tokenVoteModule && <VotesInProgress tokenCategories={tokenVoteModule.tokenCategories} />}
                <Button className="link-button" onClick={this.toggleShowVotesInProgress}>
                  <Translate value="debate.voteSession.showLess" />
                  <span className="assembl-icon-up-open pointer" />
                </Button>
              </div>
            ) : (
              <Button className="link-button" onClick={this.toggleShowVotesInProgress}>
                <Translate value="debate.voteSession.showVotesInProgress" />
                <span className="assembl-icon-down-open pointer" />
              </Button>
            )}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Proposal;