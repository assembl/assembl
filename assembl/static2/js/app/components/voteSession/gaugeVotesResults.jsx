// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type GaugeVotesResultProps = {
  title: string,
  instructions: ?string
};

const GaugeVotesResult = ({ title, instructions }: GaugeVotesResultProps) => (
  <div className="box center gauge-box">
    {instructions ? <div className="gauge-box__instructions">{instructions}</div> : null}
    <div className="gauge-box__estimate">
      <div className="margin-s">
        <Translate value="debate.voteSession.estimate" />
      </div>
      <div className="margin-s">{title}</div>
    </div>
  </div>
);

export default GaugeVotesResult;