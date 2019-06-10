// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import CheckboxList101 from './checkboxList101';
import Checkbox101 from '../checkbox101/checkbox101';
import type { CheckboxList101Type } from './checkboxList101';
import type { Checkbox101Type } from '../checkbox101/checkbox101';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^CheckboxList101$/
});

configure({ adapter: new Adapter() });

const defaultCheckbox: Checkbox101Type = {
  onChangeHandler: jest.fn()
};

const defaultCheckboxList: CheckboxList101Type = {
  checkboxes: [
    { ...defaultCheckbox },
    { ...defaultCheckbox },
    { ...defaultCheckbox },
    { ...defaultCheckbox },
    { ...defaultCheckbox }
  ]
};

describe('<CheckboxList101 /> - with shallow', () => {
  let wrapper: any;
  let checkboxes: CheckboxList101Type;

  beforeEach(() => {
    checkboxes = { ...defaultCheckboxList };
    wrapper = shallow(<CheckboxList101 {...checkboxes} />);
  });

  it('should render one list of 5 checkboxes', () => {
    expect(wrapper.find(Checkbox101)).toHaveLength(5);
  });

  it('should render an empty list message', () => {
    wrapper.setProps({ checkboxes: [] });
    expect(wrapper.contains('Nothing to display')).toBe(true);
  });
});