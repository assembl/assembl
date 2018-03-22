// @flow
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from 'react-redux-i18n';
import Slider from 'rc-slider';
import Pointer from '../svg/pointer';

type Choice = {
  id: string,
  label: string,
  value: number
};

type GaugeVoteForProposalProps = {
  disabled: boolean,
  id: string, // the vote specification id
  proposalId: string,
  voteForProposal: Function,
  instructions: ?string,
  choices: ?Array<Choice>,
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
  return (
    <Handle value={value} {...restProps}>
      <Pointer width="15px" style={style} />
    </Handle>
  );
};

class GaugeVoteForProposal extends React.Component<*, GaugeVoteForProposalProps, GaugeVoteForProposalState> {
  props: GaugeVoteForProposalProps;

  state: GaugeVoteForProposalState;

  onAfterChange: Function;

  marks: Object;

  maximum: ?number;

  minimum: ?number;

  inputElement: ?Object;

  constructor(props: GaugeVoteForProposalProps) {
    super(props);
    this.state = { value: this.props.value };
    this.onAfterChange = this.onAfterChange.bind(this);

    this.marks = {};
    this.maximum = null;
    this.minimum = null;
    this.inputElement = null;

    if (props.choices && props.choices.length) {
      const choicesValues = props.choices.reduce((accumulator, item) => {
        if ('value' in item) {
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
        this.marks[`${choice.value}`] = {
          style: markStyle,
          label: <div>{choice.label}</div>
        };
      });
    }
  }

  onAfterChange(value: number) {
    this.setState({
      value: value
    });
    if (this.inputElement && 'value' in this.inputElement) {
      this.inputElement.value = value;
    }
    this.props.voteForProposal(this.props.proposalId, this.props.id, value);
  }

  render() {
    const { instructions, disabled } = this.props;
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
          defaultValue={this.state.value}
          onAfterChange={this.onAfterChange}
        />
        <input
          type="hidden"
          name={`vote-for-proposal-${this.props.proposalId}-vote-specification-${this.props.id}`}
          value={this.state.value}
          ref={(input) => {
            this.inputElement = input;
          }}
        />
      </div>
    );
  }
}

type NumberGaugeVoteForProposalProps = {
  disabled: boolean,
  id: string, // the vote specification id
  instructions: ?string,
  minimum: ?number,
  maximum: ?number,
  nbTicks: ?number,
  unit: ?string,
  proposalId: string,
  voteForProposal: Function,
  value: number
};

class NumberGaugeVoteForProposal extends React.Component<*, NumberGaugeVoteForProposalProps, NumberGaugeVoteForProposalState> {
  props: NumberGaugeVoteForProposalProps;

  state: NumberGaugeVoteForProposalState;

  onAfterChange: Function;

  marks: Object;

  maximum: ?number;

  minimum: ?number;

  inputElement: ?Object;

  step: ?number;

  constructor(props: NumberGaugeVoteForProposalProps) {
    super(props);
    this.state = { value: this.props.value };
    this.onAfterChange = this.onAfterChange.bind(this);

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
          this.marks[`${value}`] = {
            style: markStyle,
            label: (
              <div>
                <Translate value="debate.voteSession.valueWithUnit" num={value.toFixed(2)} unit={unit} />
              </div>
            )
          };
        }
      }
    }
  }

  onAfterChange(value: number) {
    this.setState({
      value: value
    });
    if (this.inputElement && 'value' in this.inputElement) {
      this.inputElement.value = value;
    }
    this.props.voteForProposal(this.props.proposalId, this.props.id, value);
  }

  render() {
    const { instructions, disabled } = this.props;
    return (
      <div className="number-gauge-vote-for-proposal">
        {instructions ? <p>{instructions}</p> : null}
        <Slider
          disabled={disabled}
          min={this.props.minimum}
          max={this.props.maximum}
          marks={this.marks}
          step={this.step}
          included={false}
          trackStyle={trackStyle}
          railStyle={railStyle}
          handleStyle={handleStyle}
          handle={handleIcon}
          defaultValue={this.state.value}
          onAfterChange={this.onAfterChange}
        />
        <input
          type="hidden"
          name={`vote-for-proposal-${this.props.proposalId}-vote-specification-${this.props.id}`}
          value={this.state.value}
          ref={(input) => {
            this.inputElement = input;
          }}
        />
      </div>
    );
  }
}

export { GaugeVoteForProposal, NumberGaugeVoteForProposal };