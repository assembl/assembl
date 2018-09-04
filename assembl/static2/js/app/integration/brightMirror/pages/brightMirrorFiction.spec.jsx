// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import BrightMirrorFiction from './brightMirrorFiction';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';

configure({ adapter: new Adapter() });

describe('<BrightMirrorFiction /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<BrightMirrorFiction />);
  });

  it('should render a FictionHeader', () => {
    expect(wrapper.find(FictionHeader)).toHaveLength(1);
  });

  it('should render a FictionToolbar', () => {
    expect(wrapper.find(FictionToolbar)).toHaveLength(1);
  });

  it('should render a FictionBody', () => {
    expect(wrapper.find(FictionBody)).toHaveLength(1);
  });
});