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
  const gaugeHeight = '12px';
  const marks = {};
  let step = null;

  const markStyle = {
    marginTop: '7px'
  };

  if (minimum !== undefined && maximum !== undefined) {
    marks[`${minimum}`] = {
      style: markStyle,
      label: (
        <div>
          {minimum} {unit}
        </div>
      )
    };

    marks[`${maximum}`] = {
      style: markStyle,
      label: (
        <div>
          {maximum} {unit}
        </div>
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
            <div>
              {value.toFixed(2)} {unit}
            </div>
          )
        };
      }
    }
  }

  const trackStyle = [
    {
      backgroundColor: '#4F17D4', // TODO: use theme colors
      visibility: 'visible',
      height: gaugeHeight
    }
  ];

  const railStyle = {
    backgroundColor: '#E6E5F4', // TODO: use theme colors
    height: gaugeHeight
  };

  /* dotStyle prop of rc-slider mysteriously does not work anymore, so we declare these rules in the SCSS file
  const dotStyle = {
    backgroundColor: '#E6E5F4', // TODO: use theme colors
    height: '20px',
    top: '0',
    width: '2px',
    border: 'none',
    borderRadius: 'initial',
    marginLeft: '0'
  };
  */

  const handleStyle = [
    {
      backgroundColor: '#4F17D4', // TODO: use theme colors
      height: '20px',
      width: '20px',
      marginTop: '-20px',
      border: 'none',
      boxShadow: 'none'
    }
  ];

  return (
    <div className="number-gauge-vote-for-proposal">
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
        handleStyle={handleStyle}
      />
    </div>
  );
};

export default NumberGaugeVoteForProposal;