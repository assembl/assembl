// @flow
import React from 'react';
import Slider from 'rc-slider';

type Props = {
  instructions: string,
  minimum: number,
  maximum: number,
  nbTicks: number,
  unit: string
};

const NumberGaugeVoteForProposal = ({ instructions, minimum, maximum, nbTicks, unit }: Props) => {
  const marks = {};
  let step = null;

  if (minimum !== undefined && maximum !== undefined) {
    marks[`${minimum}`] = {
      style: {
        color: 'red'
      },
      label: (
        <strong>
          {minimum} {unit}
        </strong>
      )
    };

    marks[`${maximum}`] = {
      style: {
        color: 'red'
      },
      label: (
        <strong>
          {maximum} {unit}
        </strong>
      )
    };

    if (nbTicks !== undefined && nbTicks > 0) {
      step = (maximum - minimum) / (nbTicks - 1);
      for (let i = 1; i < nbTicks - 1; i += 1) {
        // minimum and maximum are already shown as ticks
        const value = minimum + i * step;
        marks[`${value}`] = {
          style: {
            color: 'black'
          },
          label: (
            <strong>
              {value.toFixed(2)} {unit}
            </strong>
          )
        };
      }
    }
  }

  return (
    <div className="gauge-vote-for-proposal">
      <p>{instructions}</p>
      <Slider min={minimum} max={maximum} marks={marks} step={step} included={false} defaultValue={minimum} />
    </div>
  );
};

export default NumberGaugeVoteForProposal;