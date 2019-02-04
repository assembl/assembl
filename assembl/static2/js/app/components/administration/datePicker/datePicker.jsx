// @flow
import React from 'react';
// import { DateRangePicker } from 'react-dates';
// import PresetsList from './presetsList';
import moment = require('moment');

type Props = {}

type State = {
    start: ?moment,
    end: ?moment
}

// A custom DatePicker component to use presets
class DatePicker extends React.PureComponent<Prop, State> {
  state = {
    start: null,
    end: null
  };

  render() {
    return <div />;
  }
}

export default DatePicker: