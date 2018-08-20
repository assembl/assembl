// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Checkbox101 from '../checkbox101/checkbox101';
import CheckboxList101 from './checkboxList101';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^CheckboxList101$/
});

configure({ adapter: new Adapter() });

describe('<CheckboxList101 /> - with shallow', () => {
  let checkboxes;
  let onChangeHandler;
  let wrapper;

  beforeEach(() => {
    checkboxes = [
      { label: 'AAA', isDone: false },
      { label: 'BBB', isDone: false },
      { label: 'CCC', isDone: true },
      { label: 'DDD', isDone: false },
      { label: 'EEE', isDone: false }
    ];

    // Mock actions
    onChangeHandler = jest.fn();

    wrapper = shallow(<CheckboxList101
      checkboxes={checkboxes}
      onChangeHandler={onChangeHandler}
    />);
  });

  it('should render one list of 5 checkboxes', () => {
    expect(wrapper.find(Checkbox101)).toHaveLength(5);
  });

  it('should render an empty list message', () => {
    wrapper.setProps({ checkboxes: [] });
    expect(wrapper.contains('Nothing to display')).toBe(true);
  });
});