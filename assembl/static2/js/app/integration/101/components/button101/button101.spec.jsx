// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Button101 from './button101';
import type { Button101Type } from './button101';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Button101$/
});

configure({ adapter: new Adapter() });

const defaultButton: Button101Type = {
  label: 'Custom label',
  isDisabled: false,
  type: 'info',
  onClickHandler: jest.fn()
};

describe('<Button101 /> - with shallow', () => {
  let wrapper: any;
  let button: Button101Type;

  beforeEach(() => {
    button = { ...defaultButton };
    wrapper = shallow(<Button101 {...button} />);
  });

  it('should render one info Button with specified values', () => {
    expect(wrapper.find('Button[bsStyle="info"][disabled=false]')).toHaveLength(1);
    expect(wrapper.contains('Custom label')).toBe(true);
  });

  it('should render one danger Button', () => {
    wrapper.setProps({ type: 'danger' });
    expect(wrapper.find('Button[bsStyle="danger"]')).toHaveLength(1);
  });

  it('should render one disabled Button', () => {
    wrapper.setProps({ isDisabled: true });
    expect(wrapper.find('Button[disabled=true]')).toHaveLength(1);
  });

  it('should render one Button that can be clicked', () => {
    wrapper.simulate('click');
    expect(button.onClickHandler).toHaveBeenCalledTimes(1);
  });
});