// @flow
import React from 'react';
import { DateRangePicker } from 'react-dates';
import moment from 'moment';
import { I18n } from 'react-redux-i18n';
import PresetsList from './presetsList';

type Props = {
  presets?: Array<Preset>,
  locale: string,
  start: ?moment$Moment,
  end: ?moment$Moment,
  handleDatesChange: Function
};

type State = {
  focusedInput: ?string,
  selectedPreset: ?Preset
};

// A custom DateRangePicker component to use presets
class CustomDateRangePicker extends React.PureComponent<Props, State> {
  state = {
    focusedInput: null,
    // selectedPreset is handled at this level and not in PresetsList
    // so that we keep this info when the DateRangePicker is closed/reopened
    selectedPreset: null
  };

  handleFocusChange = (input: ?string) => this.setState({ focusedInput: input });

  handlePresetSelect = (preset: Preset) => {
    this.setState({ selectedPreset: preset });
    this.props.handleDatesChange(preset.range);
  };

  render() {
    const { focusedInput, selectedPreset } = this.state;
    const { presets, locale, handleDatesChange, start, end } = this.props;
    moment.locale(locale); // Required to have the proper date format in the calendar
    return (
      <div className="date-range-picker">
        <DateRangePicker
          startDate={start}
          endDate={end}
          startDateId="startDateInput"
          endDateId="endDateInput"
          startDatePlaceholderText={I18n.t('administration.export.startDate')}
          endDatePlaceholderText={I18n.t('administration.export.endDate')}
          onDatesChange={handleDatesChange}
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