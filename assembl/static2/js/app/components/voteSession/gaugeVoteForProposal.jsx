// @flow
import React from 'react';
import Slider from 'rc-slider';

type Choice = {
  id: string,
  label: string,
  value: number
};

type Props = {
  instructions: string,
  choices: ?Array<Choice>
};

const GaugeVoteForProposal = ({ instructions, choices }: Props) => {
  const marks = {};
  let maximum = null;
  let minimum = null;

  if (choices && choices.length) {
    const choicesValues = choices.reduce((accumulator, item) => {
      if ('value' in item) {
        return accumulator.concat(item.value);
      }
      return accumulator;
    }, []);
    if (choicesValues.length) {
      maximum = Math.max(...choicesValues);
      minimum = Math.min(...choicesValues);
    }
  }

  if (choices && choices.length) {
    choices.forEach((choice) => {
      marks[`${choice.value}`] = {
        style: {
          color: 'black'
        },
        label: <strong>{choice.label}</strong>
      };
    });
  }

  return (
    <div className="gauge-vote-for-proposal">
      <p>{instructions}</p>
      <Slider min={minimum} max={maximum} marks={marks} included={false} step={null} />
    </div>
  );
};

export default GaugeVoteForProposal;