// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type GaugeVotesResultProps = {
  title: string
};

const GaugeVotesResult = ({ title }: GaugeVotesResultProps) => (
  <div className="box center gauge-box">
    <Translate value="debate.voteSession.estimate" />
    <h5 className="dark-title-5 margin-m">{title}</h5>
  </div>
);

export default GaugeVotesResult;