import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { datePickerPresets } from '../../../../../js/app/constants';
import { getFullDebatePreset } from '../../../../../js/app/components/form/utils';
import { mockPhasesPresets } from './constants';
import PresetsList from '../../../../../js/app/components/administration/dateRangePicker/presetsList';

configure({ adapter: new Adapter() });

describe('<PresetsLists />', () => {
  let wrapper;
  const fullDebatePreset = getFullDebatePreset(mockPhasesPresets);
  const presetsMock = [...mockPhasesPresets, fullDebatePreset, ...datePickerPresets];
  const onPressSelctMock = jest.fn();
  const presetsListProps = {
    presets: presetsMock,
    onPresetSelect: onPressSelctMock,
    selectedPreset: null
  };
  beforeEach(() => {
    wrapper = mount(<PresetsList {...presetsListProps} />);
  });
  it('should render a PresetsList component', () => {
    expect(wrapper.find(PresetsList)).toHaveLength(1);
  });
  it('should render a DropdownButton', () => {
    expect(wrapper.find('DropdownButton')).toHaveLength(1);
  });
  it('should render one MenuItem per preset in the dropdown menu', () => {
    expect(wrapper.find('MenuItem')).toHaveLength(presetsMock.length);
  });
});