// @flow
import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ParticipantsCount from './participantsCount';
import TokenVotesResults from './tokenVotesResults';
import GaugeVotesResults from './gaugeVotesResults';
import { type TokenCategories } from './tokenVoteForProposal';

type Props = {
  participantsCount: number,
  tokenCategories: TokenCategories,
  tokenVotes: { [string]: number },
  gauges: Array<Object>
};

const getNumberBoxToDisplay: Function = (tokens, gauges) => {
  const gaugesLength = gauges ? gauges.length : 0;
  const count = tokens ? 2 : 1;
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

const VotesInProgress = ({ participantsCount, tokenCategories, tokenVotes, gauges }: Props) => {
  const numberBoxToDisplay: number = getNumberBoxToDisplay(tokenCategories, gauges);
  const columnSizes: Array<number> = getColumnSizes(numberBoxToDisplay);
  return (
    <Row className="votes-in-progress background-grey">
      <Col xs={12} md={columnSizes[0]}>
        <ParticipantsCount count={participantsCount} />
      </Col>
      {tokenCategories && (
        <Col xs={12} md={columnSizes[1]}>
          <TokenVotesResults categories={tokenCategories} votes={tokenVotes} />
        </Col>
      )}
      {gauges &&
        gauges.map((gauge, index) => (
          <Col xs={12} md={columnSizes[index + 2]} key={gauge.id}>
            <GaugeVotesResults title={gauge.estimate} />
          </Col>
        ))}
    </Row>
  );
};

const mockData = {
  participantsCount: 125,
  tokenVotes: {
    category1: 112,
    category2: 44
  },
  gauges: [{ id: '1234', estimate: '6 M€' }, { id: '5678', estimate: '8 M€' }, { id: '9887', estimate: '18 M€' }]
};

// $FlowFixMe
const withMockData = data => Component => props => <Component {...data} {...props} />;

export default withMockData(mockData)(VotesInProgress);