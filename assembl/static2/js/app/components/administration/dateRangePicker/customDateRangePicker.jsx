// @flow
import React from 'react';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';
import PresetsList from './presetsList';

type Props = {
  presets?: Array<Preset>
};

type State = {
  start: ?moment,
  end: ?moment,
  focusedInput: ?string,
  selectedPreset: ?Preset
};

// A custom DatePicker component to use presets
class CustomDateRangePicker extends React.PureComponent<Props, State> {
  state = {
    start: null,
    end: null,
    focusedInput: null,
    selectedPreset: null
  };

  handleDatesChange = ({ startDate, endDate }: DateRange) => this.setState({ start: startDate, end: endDate });

  handleFocusChange = (input: ?string) => this.setState({ focusedInput: input });

  handlePresetSelect = (preset: Preset) => {
    this.setState({ selectedPreset: preset });
    this.handleDatesChange(preset.range);
  };

  render() {
    const { start, end, focusedInput, selectedPreset } = this.state;
    const { presets } = this.props;
    return (
      <div className="date-range-picker">
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
          renderCalendarInfo={() =>
            (presets ? (
              <PresetsList presets={presets} onPresetSelect={this.handlePresetSelect} selectedPreset={selectedPreset} />
            ) : null)
          }
        />
      </div>
    );
  }
}

export default CustomDateRangePicker;