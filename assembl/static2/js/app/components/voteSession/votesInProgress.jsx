// @flow
import * as React from 'react';
import { Row, Col } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
import ParticipantsCount from './participantsCount';
import TokenVotesResults from './tokenVotesResults';
import GaugeVotesResults from './gaugeVotesResults';
import { findTokenVoteModule, filterGaugeVoteModules, type VoteSpecification } from '../../pages/voteSession';

type Props = {
  modules: Array<VoteSpecification>,
  numParticipants: number
};

const getNumberBoxToDisplay: Function = (tokens, gauges) => {
  const gaugesLength = gauges ? gauges.length : 0;
  const count = tokens.length ? 2 : 1;
  return count + gaugesLength;
};

const getColumnSizes: Function = (numberBoxToDisplay) => {
  switch (numberBoxToDisplay) {
  case 1:
    return [12];
  case 2:
    return [6, 6];
  case 3:
    return [4, 4, 4];
  case 4:
    return [6, 6, 6, 6];
  case 5:
    return [6, 6, 4, 4, 4];
  case 6:
    return [4, 4, 4, 4, 4, 4];
  default:
    return [12];
  }
};

const VotesInProgress = ({ modules, numParticipants }: Props) => {
  const tokenVoteModule = modules ? findTokenVoteModule(modules) : null;
  const tokenCategories = tokenVoteModule ? tokenVoteModule.tokenCategories : [];
  const allGauges = filterGaugeVoteModules(modules);
  const numberBoxToDisplay: number = getNumberBoxToDisplay(tokenCategories, allGauges);
  const columnSizes: Array<number> = getColumnSizes(numberBoxToDisplay);
  let index = tokenVoteModule ? 2 : 1;
  return (
    <Row className="votes-in-progress background-grey">
      <Col className="padding-s" xs={12} md={columnSizes[0]}>
        <ParticipantsCount count={numParticipants} />
      </Col>
      {tokenVoteModule &&
        tokenCategories.length > 0 && (
          <Col className="padding-s" xs={12} md={columnSizes[1]}>
            <TokenVotesResults
              categories={tokenCategories}
              tokenVotes={tokenVoteModule.tokenVotes}
              numVotes={tokenVoteModule.numVotes}
              titleMsgId="debate.voteSession.currentTokenDistribution"
            />
          </Col>
        )}
      {allGauges.map((gauge) => {
        if (gauge.voteType === 'gauge_vote_specification') {
          const colSize = columnSizes[index];
          index += 1;
          // $FlowFixMe title incompatible type
          const title: string =
            gauge.averageLabel === null ? I18n.t('debate.voteSession.participantsCount', { count: 0 }) : gauge.averageLabel || '';
          return (
            <Col className="padding-s" xs={12} md={colSize} key={gauge.id}>
              <GaugeVotesResults title={title} instructions={gauge.instructions} />
            </Col>
          );
        } else if (gauge.voteType === 'number_gauge_vote_specification') {
          const colSize = columnSizes[index];
          index += 1;
          const title =
            gauge.averageResult === null
              ? I18n.t('debate.voteSession.participantsCount', { count: 0 })
              : I18n.t('debate.voteSession.valueWithUnit', { num: gauge.averageResult, unit: gauge.unit || '' });
          return (
            <Col className="padding-s" xs={12} md={colSize} key={gauge.id}>
              <GaugeVotesResults title={title} instructions={gauge.instructions} />
            </Col>
          );
        }
        return null;
      })}
    </Row>
  );
};

export default VotesInProgress;