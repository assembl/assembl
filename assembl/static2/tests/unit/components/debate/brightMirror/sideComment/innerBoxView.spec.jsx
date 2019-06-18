// @flow
import React from 'react';

import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow, mount } from 'enzyme';
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
  isConnectedUser: jest.fn(() => true),
  getIconPath: jest.fn(() => 'icons/path/avatar')
}));

jest.mock('../../../../../../js/app/utils/permissions', () => ({ connectedUserCan: jest.fn(() => true) }));

describe('<InnerBoxView /> - default with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<InnerBoxView {...defaultInnerBoxViewProps} />);
  });

  it('should render author name', () => {
    expect(wrapper.find('div[className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div[className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('div[className="body-container"]')).toHaveLength(1);
  });

  it('should not render navigation arrows', () => {
    expect(wrapper.find('span[className="assembl-icon-angle-right"]')).toHaveLength(0);
  });

  it('should render menu button', () => {
    expect(wrapper.find('Button[className="action-menu-btn"]')).toHaveLength(1);
  });
});

describe('<InnerBoxView /> - multiple with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<InnerBoxView {...multipleInnerBoxViewProps} />);
  });

  it('should render author name', () => {
    expect(wrapper.find('div[className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div[className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('div[className="body-container"]')).toHaveLength(1);
  });

  it('should render navigation arrows', () => {
    expect(wrapper.find('span[className="assembl-icon-angle-left grey"]')).toHaveLength(1);
    expect(wrapper.find('span[className="assembl-icon-angle-right grey"]')).toHaveLength(1);
  });

  it('should render menu button', () => {
    expect(wrapper.find('Button[className="action-menu-btn"]')).toHaveLength(1);
  });
});

describe('<InnerBoxView /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<InnerBoxView {...defaultInnerBoxViewProps} />);
  });

  it('should display delete button', () => {
    wrapper.find('Button[className="action-menu-btn"]').simulate('click');
    expect(wrapper.find('Button[className="delete-btn"]')).toHaveLength(1);
  });

  it('should call delete Post', () => {
    const deleteSpy = jest.fn(() => {});
    wrapper.setProps({ ...defaultInnerBoxViewProps, deletePost: deleteSpy });

    wrapper.find('Button[className="action-menu-btn"]').simulate('click');
    wrapper.find('Button[className="delete-btn"]').simulate('click');

    expect(deleteSpy).toHaveBeenCalled();
  });

  it('should display edit button', () => {
    wrapper.find('Button[className="action-menu-btn"]').simulate('click');
    expect(wrapper.find('Button[className="edit-btn"]')).toHaveLength(1);
  });

  it('should call setEditMode', () => {
    const editSpy = jest.fn(() => {});
    wrapper.setProps({ ...defaultInnerBoxViewProps, setEditMode: editSpy });

    wrapper.find('Button[className="action-menu-btn"]').simulate('click');
    wrapper.find('Button[className="edit-btn"]').simulate('click');

    expect(editSpy).toHaveBeenCalled();
  });
});