// @flow
import React from 'react';
import Slider from 'rc-slider';
import Pointer from '../svg/pointer';

type Choice = {
  id: string,
  label: string,
  value: number
};

type GaugeVoteForProposalProps = {
  instructions: string,
  choices: ?Array<Choice>
};

const gaugeHeight = '12px';

const markStyle = {
  marginTop: '7px'
};

const trackStyle = [
  {
    visibility: 'visible',
    height: gaugeHeight
  }
];

const railStyle = {
  backgroundColor: '#E6E5F4',
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
    height: '0',
    width: '0',
    marginTop: '-20px',
    border: 'none',
    boxShadow: 'none'
  }
];

const Handle = Slider.Handle;
const handleIcon = (props) => {
  const { value, dragging, ...restProps } = props;
  const style = {
    marginTop: '-15px',
    cursor: '-webkit-grab'
  };
  return (
    <Handle value={value} {...restProps}>
      <Pointer width="15px" style={style} />
    </Handle>
  );
};

const GaugeVoteForProposal = ({ instructions, choices }: GaugeVoteForProposalProps) => {
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
        style: markStyle,
        label: <div>{choice.label}</div>
      };
    });
  }

  return (
    <div className="gauge-vote-for-proposal">
      <p>{instructions}</p>
      <Slider
        min={minimum}
        max={maximum}
        marks={marks}
        included={false}
        step={null}
        trackStyle={trackStyle}
        railStyle={railStyle}
        handleStyle={handleStyle}
        handle={handleIcon}
      />
    </div>
  );
};

type NumberGaugeVoteForProposalProps = {
  instructions: string,
  minimum: number,
  maximum: number,
  nbTicks: number,
  unit: string
};

const NumberGaugeVoteForProposal = ({ instructions, minimum, maximum, nbTicks, unit }: NumberGaugeVoteForProposalProps) => {
  const marks = {};
  let step = null;

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
        handle={handleIcon}
      />
    </div>
  );
};

export { GaugeVoteForProposal, NumberGaugeVoteForProposal };