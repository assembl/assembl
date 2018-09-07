// @flow
/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import Slider from 'rc-slider';

import Pointer from '../svg/pointer';

type Choice = {|
  id: string,
  value: number,
  label: ?string,
  labelEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>
|};

type SharedProps = {
  id: string, // the vote specification id
  instructions: ?string,
  proposalId: string,
  voteForProposal?: Function
};

type GaugeVoteForProposalProps = SharedProps & {
  sliderProps: {
    disabled: ?boolean,
    max: ?number,
    min: ?number,
    marks: { [string]: number },
    step: ?number,
    value: ?number
  }
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
  delete restProps.index;
  const style = {
    marginTop: '-15px',
    cursor: '-webkit-grab'
  };

  if (value === null) {
    restProps.className += ' no-value';
  }

  return (
    <Handle value={value} {...restProps}>
      <Pointer width="15px" style={style} />
    </Handle>
  );
};

/* Base component that render the slider and handle the value / change */
class GaugeVoteForProposal extends React.Component<GaugeVoteForProposalProps> {
  handleChange = (value: ?number) => {
    const { id, proposalId, voteForProposal } = this.props;
    if (voteForProposal) {
      voteForProposal(proposalId, id, value);
    }
  };

  reset = () => {
    this.handleChange(null);
  };

  render() {
    const { instructions, sliderProps } = this.props;
    return (
      <React.Fragment>
        {instructions ? <p>{instructions}</p> : null}
        <div className="gauge-container">
          <Slider
            included={false}
            trackStyle={trackStyle}
            railStyle={railStyle}
            handleStyle={handleStyle}
            handle={handleIcon}
            onChange={this.handleChange}
            {...sliderProps}
          />
          {!sliderProps.disabled && <span className="assembl-icon-delete grey" onClick={this.reset} />}
        </div>
      </React.Fragment>
    );
  }
}

type ChoiceGaugeVoteForProposalProps = SharedProps & {
  choices: ?Array<?Choice>,
  disabled: boolean,
  value: ?number
};

export const ChoiceGaugeVoteForProposal = ({ choices, disabled, value, ...rest }: ChoiceGaugeVoteForProposalProps) => {
  const marks = {};
  let maximum = null;
  let minimum = null;
  if (choices && choices.length) {
    const choicesValues = choices.reduce((accumulator, item) => {
      if (item && 'value' in item) {
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
      if (!choice) {
        return;
      }
      marks[`${choice.value}`] = {
        style: markStyle,
        label: <div>{choice.label}</div>
      };
    });
  }

  const sliderProps = {
    disabled: disabled,
    max: maximum,
    min: minimum,
    marks: marks,
    step: null,
    value: value
  };

  return (
    <div className="gauge-vote-for-proposal">
      <GaugeVoteForProposal {...rest} sliderProps={sliderProps} />
    </div>
  );
};

ChoiceGaugeVoteForProposal.defaultProps = {
  disabled: false
};

type NumberGaugeVoteForProposalProps = SharedProps & {
  disabled: boolean,
  maximum: ?number,
  minimum: ?number,
  nbTicks: ?number,
  unit: ?string,
  value: ?number
};

export const NumberGaugeVoteForProposal = ({
  disabled,
  maximum,
  minimum,
  nbTicks,
  unit,
  value,
  ...rest
}: NumberGaugeVoteForProposalProps) => {
  const marks = {};
  let step;
  if (minimum !== undefined && minimum !== null && maximum !== undefined && maximum !== null) {
    marks[`${minimum}`] = {
      style: markStyle,
      label: (
        <div>
          <Translate value="debate.voteSession.valueWithUnit" num={minimum} unit={unit} />
        </div>
      )
    };

    marks[`${maximum}`] = {
      style: markStyle,
      label: (
        <div>
          <Translate value="debate.voteSession.valueWithUnit" num={maximum} unit={unit} />
        </div>
      )
    };

    if (nbTicks !== undefined && nbTicks !== null && nbTicks > 0) {
      step = (maximum - minimum) / (nbTicks - 1);
      for (let i = 1; i < nbTicks - 1; i += 1) {
        // minimum and maximum are already shown as ticks
        const tickValue = minimum + i * step;
        // don't show decimals if .00
        let valueStr = tickValue.toFixed(2);
        if (valueStr.slice(valueStr.length - 3) === '.00') {
          valueStr = valueStr.slice(0, valueStr.length - 3);
        }
        marks[`${tickValue}`] = {
          style: markStyle,
          label: (
            <div>
              <Translate value="debate.voteSession.valueWithUnit" num={valueStr} unit={unit} />
            </div>
          )
        };
      }
    }
  }

  const sliderProps = {
    disabled: disabled,
    max: maximum,
    min: minimum,
    marks: marks,
    step: step,
    value: value
  };

  return (
    <div className="number-gauge-vote-for-proposal">
      <GaugeVoteForProposal {...rest} sliderProps={sliderProps} />
    </div>
  );
};

NumberGaugeVoteForProposal.defaultProps = {
  disabled: false
};