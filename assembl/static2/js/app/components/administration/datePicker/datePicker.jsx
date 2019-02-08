// @flow
import React from 'react';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';
import PresetsList from './presetsList';

type Range = {
  startDate: moment,
  endDate: moment
};

type Preset = {
  id: string,
  range: Range,
  label: string
};

type Props = {
  presets: Array<Preset>
};

type State = {
  start: ?moment,
  end: ?moment
};

// A custom DatePicker component to use presets
class DatePicker extends React.PureComponent<Props, State> {
  state = {
    start: null,
    end: null,
    focusedInput: null
  };

  handleDatesChange = ({ startDate, endDate }) => this.setState({ start: startDate, end: endDate });

  handleFocusChange = input => this.setState({ focusedInput: input });

  handlePresetSelect = (range: Range) => this.handleDatesChange(range);

  render() {
    const { start, end, focusedInput } = this.state;
    const { presets } = this.props;
    return (
      <div className="datepicker-with-presets">
        <DateRangePicker
          startDate={start}
          endDate={end}
          startDateId="foo"
          endDateId="bar"
          onDatesChange={this.handleDatesChange}
          focusedInput={focusedInput}
          onFocusChange={this.handleFocusChange}
          small
          numberOfMonths={1}
          isOutsideRange={() => false}
        />
        <PresetsList presets={presets} onSelect={this.handlePresetSelect} />
      </div>
    );
  }
}

export default DatePicker;