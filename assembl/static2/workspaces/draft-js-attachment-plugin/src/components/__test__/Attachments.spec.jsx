// @flow
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line
import type { JestMockT } from 'jest';
import React from 'react';
import { EditorState } from 'draft-js';
import renderer from 'react-test-renderer';

import Attachments from '../Attachments';
import getAttachments from '../../utils/getAttachments';

configure({ adapter: new Adapter() });

jest.mock('../../utils/getAttachments');

function mock(mockFn) {
  return ((mockFn: any): JestMockT);
}

describe('Attachments component', () => {
  let URL;
  afterEach(() => {
    global.URL = URL;
  });

  beforeEach(() => {
    URL = global.URL;
    global.URL = {
      createObjectURL: () => 'some-dummy-url'
    };
  });

  it('should render an empty list of attachments', () => {
    mock(getAttachments).mockImplementation(() => []);
    const editorState = EditorState.createEmpty();
    const removeAttachmentSpy = jest.fn();
    const props = {
      removeAttachment: removeAttachmentSpy,
      store: {
        getEditorState: () => editorState,
        setEditorState: jest.fn()
      }
    };
    const component = renderer.create(<Attachments {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a list of attachments', () => {
    const editorState = EditorState.createEmpty();
    const myfile = new File(['foo'], 'my-img.jpg');
    mock(getAttachments).mockImplementation(() => [
      { blockKey: 'block1', entityKey: '1', src: 'my-file.pdf', title: 'My pdf' },
      { blockKey: 'block2', entityKey: '2', src: myfile, title: 'My image' }
    ]);
    const removeAttachmentSpy = jest.fn();
    const props = {
      removeAttachment: removeAttachmentSpy,
      store: {
        getEditorState: jest.fn(() => editorState),
        setEditorState: jest.fn()
      }
    };
    const component = renderer.create(<Attachments {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should remove an attachment when user clicks on delete icon', () => {
    mock(getAttachments).mockImplementation(() => [{ blockKey: 'block1', entityKey: '1', src: 'my-file.pdf', title: 'My pdf' }]);
    const editorState = EditorState.createEmpty();
    const removeAttachmentSpy = jest.fn();
    const setEditorStateSpy = jest.fn();
    const props = {
      removeAttachment: removeAttachmentSpy,
      store: {
        getEditorState: jest.fn(() => editorState),
        setEditorState: setEditorStateSpy
      }
    };
    const wrapper = mount(<Attachments {...props} />);
    wrapper.find('span.assembl-icon-delete').simulate('click');
    expect(setEditorStateSpy).toHaveBeenCalled();
    expect(removeAttachmentSpy).toHaveBeenCalledWith(editorState, 'block1');
  });
});