// @flow
import React from 'react';
import Slider from 'rc-slider';

const marks = {
  '-10': '-10°C',
  '0': '<strong>0°C</strong>',
  '26': '26°C',
  '37': '37°C',
  '50': '50°C',
  '100': {
    style: {
      color: 'red'
    },
    label: '<strong>100°C</strong>'
  }
};
/* eslint-enable */

type Props = {
  instructions: string
};

const GaugeVoteForProposal = ({ instructions }: Props) => (
  <div className="gauge-vote-for-proposal">
    <p>{instructions}</p>
    <Slider min={-10} marks={marks} step={10} included={false} defaultValue={20} />
  </div>
);

export default GaugeVoteForProposal;