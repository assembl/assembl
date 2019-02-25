import React from 'react';
import { configure, mount, shallow } from 'enzyme';
import 'react-dates/initialize';
import Adapter from 'enzyme-adapter-react-16.3';
import moment from 'moment';

import CustomDateRangePicker from './customDateRangePicker';

// Import range presets for the datepicker
import { datePickerPresets } from '../../../constants';
import { getFullDebatePreset } from '../../form/utils';
import PresetsList from './presetsList';

configure({ adapter: new Adapter() });

const mockPhasesPresets = [
  {
    id: 1,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment(20190101, 'YYYYMMDD'),
      endDate: moment(20190120, 'YYYYMMDD')
    },
    type: 'phase'
  },
  {
    id: 2,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment(20190121, 'YYYYMMDD'),
      endDate: moment(20190226, 'YYYYMMDD')
    },
    type: 'phase'
  },
  {
    id: 3,
    labelTranslationKey: 'administration.export.presets.phase',
    range: {
      startDate: moment(20190227, 'YYYYMMDD'),
      endDate: moment(20190315, 'YYYYMMDD')
    },
    type: 'phase'
  }
];

const fullDebatePreset = getFullDebatePreset(mockPhasesPresets);

describe('getFullDebatePreset function', () => {
  it('should return an object with dates going from the first phase start to the last phase end', () => {
    const result = JSON.stringify(fullDebatePreset);
    const expected = JSON.stringify({
      id: 4,
      labelTranslationKey: 'administration.export.presets.fullDebate',
      range: {
        startDate: '2018-12-31T23:00:00.000Z',
        endDate: '2019-03-14T23:00:00.000Z'
      },
      type: 'basic'
    });
    expect(result).toEqual(expected);
  });
});

const dateRangePickerProps = {
  presets: [...mockPhasesPresets, fullDebatePreset, ...datePickerPresets]
};

describe('<CustomDateRangePicker />', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(<CustomDateRangePicker {...dateRangePickerProps} />);
  });
  it('should render a surrounding div with the appropriate class', () => {
    expect(wrapper.find('div [className=\'date-range-picker\']')).toHaveLength(1);
  });
  it('should render a CustomDateRangePicker component', () => {
    expect(wrapper.find(CustomDateRangePicker)).toHaveLength(1);
  });
});