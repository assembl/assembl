// @flow
/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import { Button } from 'react-bootstrap';
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

type GaugeVoteForProposalProps = {
  disabled?: boolean,
  id: string, // the vote specification id
  proposalId: string,
  voteForProposal?: Function,
  instructions: ?string,
  choices: ?Array<?Choice>,
  value: number
};

type GaugeVoteForProposalState = {
  value: number
};

type NumberGaugeVoteForProposalState = {
  value: number
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

class GaugeVoteForProposal extends React.Component<GaugeVoteForProposalProps, GaugeVoteForProposalState> {
  marks: Object;

  maximum: ?number;

  minimum: ?number;

  inputElement: ?Object;

  constructor(props: GaugeVoteForProposalProps) {
    super(props);
    this.marks = {};
    this.maximum = null;
    this.minimum = null;

    if (props.choices && props.choices.length) {
      const choicesValues = props.choices.reduce((accumulator, item) => {
        if (item && 'value' in item) {
          return accumulator.concat(item.value);
        }
        return accumulator;
      }, []);
      if (choicesValues.length) {
        this.maximum = Math.max(...choicesValues);
        this.minimum = Math.min(...choicesValues);
      }
    }

    if (props.choices && props.choices.length) {
      props.choices.forEach((choice) => {
        if (!choice) {
          return;
        }
        this.marks[`${choice.value}`] = {
          style: markStyle,
          label: <div>{choice.label}</div>
        };
      });
    }
  }

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
    const { instructions, disabled, value } = this.props;
    return (
      <div className="gauge-vote-for-proposal">
        {instructions ? <p>{instructions}</p> : null}
        <Slider
          disabled={disabled}
          min={this.minimum}
          max={this.maximum}
          marks={this.marks}
          included={false}
          step={null}
          trackStyle={trackStyle}
          railStyle={railStyle}
          handleStyle={handleStyle}
          handle={handleIcon}
          onChange={this.handleChange}
          value={value}
        />
        <Button onClick={this.reset}>
          <span className="assembl-icon-delete grey" />
        </Button>
      </div>
    );
  }
}

type NumberGaugeVoteForProposalProps = {
  disabled?: boolean,
  id: string, // the vote specification id
  instructions: ?string,
  minimum: ?number,
  maximum: ?number,
  nbTicks: ?number,
  unit: ?string,
  proposalId: string,
  voteForProposal?: Function,
  value: number
};

class NumberGaugeVoteForProposal extends React.Component<NumberGaugeVoteForProposalProps, NumberGaugeVoteForProposalState> {
  marks: Object;

  maximum: ?number;

  minimum: ?number;

  inputElement: ?Object;

  step: ?number;

  constructor(props: NumberGaugeVoteForProposalProps) {
    super(props);
    this.marks = {};
    this.inputElement = null;
    this.step = null;

    const minimum = props.minimum;
    const maximum = props.maximum;
    const nbTicks = props.nbTicks;
    const unit = props.unit;

    if (minimum !== undefined && minimum !== null && maximum !== undefined && maximum !== null) {
      this.marks[`${minimum}`] = {
        style: markStyle,
        label: (
          <div>
            <Translate value="debate.voteSession.valueWithUnit" num={minimum} unit={unit} />
          </div>
        )
      };

      this.marks[`${maximum}`] = {
        style: markStyle,
        label: (
          <div>
            <Translate value="debate.voteSession.valueWithUnit" num={maximum} unit={unit} />
          </div>
        )
      };

      if (nbTicks !== undefined && nbTicks !== null && nbTicks > 0) {
        this.step = (maximum - minimum) / (nbTicks - 1);
        for (let i = 1; i < nbTicks - 1; i += 1) {
          // minimum and maximum are already shown as ticks
          const value = minimum + i * this.step;
          // don't show decimals if .00
          let valueStr = value.toFixed(2);
          if (valueStr.slice(valueStr.length - 3) === '.00') {
            valueStr = valueStr.slice(0, valueStr.length - 3);
          }
          this.marks[`${value}`] = {
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
  }

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
    const { disabled, instructions, maximum, minimum, value } = this.props;
    return (
      <div className="number-gauge-vote-for-proposal">
        {instructions ? <p>{instructions}</p> : null}
        <Slider
          disabled={disabled}
          min={minimum}
          max={maximum}
          marks={this.marks}
          step={this.step}
          included={false}
          trackStyle={trackStyle}
          railStyle={railStyle}
          handleStyle={handleStyle}
          handle={handleIcon}
          onChange={this.handleChange}
          value={value}
        />
        <Button onClick={this.reset}>
          <span className="assembl-icon-delete grey" />
        </Button>
      </div>
    );
  }
}

export { GaugeVoteForProposal, NumberGaugeVoteForProposal };