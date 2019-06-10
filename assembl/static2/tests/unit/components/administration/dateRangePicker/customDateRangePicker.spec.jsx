import React from 'react';
import moment from 'moment';
import { configure, mount } from 'enzyme';
import 'react-dates/initialize';
import Adapter from 'enzyme-adapter-react-16.3';

import CustomDateRangePicker from '../../../../../js/app/components/administration/dateRangePicker/customDateRangePicker';

// Import range presets for the datepicker
import { datePickerPresets } from '../../../../../js/app/constants';
import { getFullDebatePreset } from '../../../../../js/app/components/form/utils';
// Import fake phases ranges presets
import { mockPhasesPresets } from './constants';

configure({ adapter: new Adapter() });

const fullDebatePreset = getFullDebatePreset(mockPhasesPresets);

describe('getFullDebatePreset function', () => {
  it('should return an object with dates going from the first phase start to the last phase end', () => {
    const result = JSON.stringify(fullDebatePreset);
    const expected = JSON.stringify({
      id: 4,
      labelTranslationKey: 'administration.export.presets.fullDebate',
      range: {
        startDate: moment('2019-01-01 13:00:00'),
        endDate: moment('2019-03-15 13:00:00')
      },
      type: 'basic'
    });
    expect(result).toEqual(expected);
  });
});

const dateRangePickerProps = {
  presets: [...mockPhasesPresets, fullDebatePreset, ...datePickerPresets],
  handleDatesChange: jest.fn(() => {}),
  locale: 'fr',
  start: null,
  end: null
};

describe('<CustomDateRangePicker />', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(<CustomDateRangePicker {...dateRangePickerProps} />);
  });
  it('should render a surrounding div with the appropriate class', () => {
    expect(wrapper.find('div[className=\'date-range-picker\']')).toHaveLength(1);
  });
  it('should render a CustomDateRangePicker component', () => {
    expect(wrapper.find(CustomDateRangePicker)).toHaveLength(1);
  });
});