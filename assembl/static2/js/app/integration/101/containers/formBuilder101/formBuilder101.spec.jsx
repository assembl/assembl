// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FormBuilder101 from './formBuilder101';
import Button101 from '../../components/button101/button101';
import CheckboxList101 from '../../components/checkboxList101/checkboxList101';

configure({ adapter: new Adapter() });

describe('<FormBuilder101 /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<FormBuilder101 />);
  });

  it('should render a Button101', () => {
    expect(wrapper.find(Button101)).toHaveLength(1);
  });

  it('should render a CheckboxList101', () => {
    expect(wrapper.find(CheckboxList101)).toHaveLength(1);
  });
});