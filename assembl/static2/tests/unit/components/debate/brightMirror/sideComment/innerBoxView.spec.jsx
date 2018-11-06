// @flow
import React from 'react';

import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import InnerBoxView from '../../../../../../js/app/components/debate/brightMirror/sideComment/innerBoxView';
import {
  defaultInnerBoxViewProps,
  multipleInnerBoxViewProps
} from '../../../../../../js/app/stories/components/debate/brightMirror/sideComment/innerBoxView.stories';

initStoryshots({
  storyKindRegex: /^InnerBoxView$/
});

configure({ adapter: new Adapter() });

// Mock utils functions
jest.mock('../../../../../../js/app/utils/globalFunctions', () => ({
  getConnectedUserId: jest.fn(() => '2'),
  getIconPath: jest.fn(() => 'icons/path/avatar')
}));

describe('<InnerBoxView /> - default with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<InnerBoxView {...defaultInnerBoxViewProps} />);
  });

  it('should render author name', () => {
    expect(wrapper.find('div [className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div [className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('div [className="body-container"]')).toHaveLength(1);
  });

  it('should not render navigation arrows', () => {
    expect(wrapper.find('div [className="assembl-icon-down-open grey"]')).toHaveLength(0);
  });

  it('should render menu button', () => {
    wrapper.setProps({ setEditMode: jest.fn() });
    expect(wrapper.find('Button [className="action-menu-btn"]')).toHaveLength(1);
  });
});

describe('<InnerBoxView /> - multiple with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<InnerBoxView {...multipleInnerBoxViewProps} />);
  });

  it('should render author name', () => {
    expect(wrapper.find('div [className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div [className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('div [className="body-container"]')).toHaveLength(1);
  });

  it('should render navigation arrows', () => {
    expect(wrapper.find('div [className="assembl-icon-down-open grey"]')).toHaveLength(2);
  });

  it('should not render menu button', () => {
    expect(wrapper.find('Button [className="action-menu-btn"]')).toHaveLength(0);
  });
});