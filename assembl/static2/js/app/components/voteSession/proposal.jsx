// @flow
import * as React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Map } from 'immutable';

import { renderRichtext } from '../../utils/linkify';
import TokenVoteForProposal from './tokenVoteForProposal';
import { ChoiceGaugeVoteForProposal, NumberGaugeVoteForProposal } from './gaugeVoteForProposal';
import VotesInProgress from './votesInProgress';
import {
  findTokenVoteModule,
  filterGaugeVoteModules,
  type RemainingTokensByCategory,
  type UserTokenVotes,
  type UserGaugeVotes,
  type VoteSpecification
} from '../../pages/voteSession';

type Props = {
  description: ?string,
  id: string,
  modules: Array<VoteSpecification>,
  remainingTokensByCategory: RemainingTokensByCategory,
  seeCurrentVotes: boolean,
  title: ?string,
  userGaugeVotes: UserGaugeVotes,
  userTokenVotes: UserTokenVotes,
  numParticipants: number,
  voteForProposalToken: Function,
  voteForProposalGauge: Function
};

type State = {
  showVotesInProgress: boolean
};

class Proposal extends React.Component<Props, State> {
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
      numParticipants,
      remainingTokensByCategory,
      seeCurrentVotes,
      title,
      userGaugeVotes,
      userTokenVotes,
      voteForProposalToken,
      voteForProposalGauge
    } = this.props;
    const tokenVoteModule = modules ? findTokenVoteModule(modules) : null;
    return (
      <div className="theme-box">
        <Row className="proposal">
          <Col xs={12} md={5} className="margin-m">
            <h3 className="proposal-title dark-title-3">{title}</h3>
            <div className="text">{renderRichtext(description || '')}</div>
          </Col>
          <Col xs={12} mdOffset={1} md={6} className="proposal-vote-modules">
            {tokenVoteModule && (
              <TokenVoteForProposal
                key={`${id}-TokenVoteForProposal-${tokenVoteModule.id}`}
                exclusiveCategories={tokenVoteModule.exclusiveCategories}
                instructions={tokenVoteModule.instructions}
                proposalId={id}
                remainingTokensByCategory={remainingTokensByCategory}
                tokenCategories={tokenVoteModule.tokenCategories}
                userTokenVotesForProposal={userTokenVotes.getIn([id, tokenVoteModule.id], Map())}
                voteForProposal={voteForProposalToken}
                moduleId={tokenVoteModule.id}
              />
            )}

            {modules &&
              filterGaugeVoteModules(modules).map((module) => {
                if (module.voteType === 'gauge_vote_specification') {
                  return (
                    <ChoiceGaugeVoteForProposal
                      key={`${id}-GaugeVoteForProposal-${module.id}`}
                      {...module}
                      voteForProposal={voteForProposalGauge}
                      proposalId={id}
                      value={userGaugeVotes.getIn([id, module.id], null)}
                    />
                  );
                } else if (module.voteType === 'number_gauge_vote_specification') {
                  return (
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
                      value={userGaugeVotes.getIn([id, module.id], null)}
                    />
                  );
                }
                return null;
              })}
          </Col>
        </Row>
        {seeCurrentVotes &&
          this.state.showVotesInProgress && (
            <div className="expand-result">
              <Row className="expand-row background-grey">
                <Col xs={12} md={12} className="center">
                  <Button className="link-button" onClick={this.toggleShowVotesInProgress}>
                    <Translate value="debate.voteSession.showLess" />
                  </Button>
                </Col>
              </Row>
              <VotesInProgress modules={modules} numParticipants={numParticipants} />
            </div>
          )}
        {seeCurrentVotes &&
          !this.state.showVotesInProgress && (
            <div className="expand-result">
              <Row className="expand-row background-grey">
                <Col xs={12} md={12} className="center">
                  <Button className="link-button" onClick={this.toggleShowVotesInProgress}>
                    <Translate value="debate.voteSession.showVotesInProgress" />
                  </Button>
                </Col>
              </Row>
            </div>
          )}
      </div>
    );
  }
}

export default Proposal;