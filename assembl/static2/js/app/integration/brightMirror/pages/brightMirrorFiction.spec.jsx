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
import BackButton from '../../../components/debate/common/backButton';
import FictionCommentHeader from '../../../components/debate/brightMirror/fictionCommentHeader';
import FictionCommentForm from '../../../components/debate/brightMirror/fictionCommentForm';
import TagOnPost from '../../../components/tagOnPost/tagOnPost';
import { FictionComment } from '../../../components/debate/brightMirror/fictionComment';

configure({ adapter: new Adapter() });

describe('<BrightMirrorFiction /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<BrightMirrorFiction />);
  });

  it('should render a BackButton', () => {
    expect(wrapper.find(BackButton)).toHaveLength(1);
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

  it('should render a FictionCommentHeader', () => {
    expect(wrapper.find(FictionCommentHeader)).toHaveLength(1);
  });

  it('should render a FictionCommentForm', () => {
    expect(wrapper.find(FictionCommentForm)).toHaveLength(1);
  });

  it('should render a FictionComment', () => {
    expect(wrapper.find(FictionComment)).toHaveLength(20);
  });

  it('should render a TagOnPost', () => {
    expect(wrapper.find(TagOnPost)).toHaveLength(1);
  });
});