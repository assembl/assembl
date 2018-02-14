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

  const markStyle = {
    color: 'black',
    marginTop: '10px'
  };

  const extremumMarkStyle = Object.assign({}, markStyle, { color: 'red' });

  if (minimum !== undefined && maximum !== undefined) {
    marks[`${minimum}`] = {
      style: extremumMarkStyle,
      label: (
        <strong>
          {minimum} {unit}
        </strong>
      )
    };

    marks[`${maximum}`] = {
      style: extremumMarkStyle,
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
          style: markStyle,
          label: (
            <strong>
              {value.toFixed(2)} {unit}
            </strong>
          )
        };
      }
    }
  }

  const trackStyle = [
    {
      backgroundColor: '#4F17D4', // TODO: use theme colors
      visibility: 'visible',
      height: '20px'
    }
  ];

  const railStyle = {
    backgroundColor: '#E6E5F4', // TODO: use theme colors
    height: '20px'
  };

  const dotStyle = {
    backgroundColor: '#E6E5F4', // TODO: use theme colors
    height: '20px',
    top: '0',
    width: '2px',
    border: 'none',
    borderRadius: 'initial',
    marginLeft: '0'
  };

  return (
    <div className="gauge-vote-for-proposal">
      <p>{instructions}</p>
      <Slider
        min={minimum}
        max={maximum}
        marks={marks}
        step={step}
        included={false}
        defaultValue={minimum}
        trackStyle={trackStyle}
        railStyle={railStyle}
        dotStyle={dotStyle}
      />
    </div>
  );
};

export default NumberGaugeVoteForProposal;