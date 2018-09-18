// @flow
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
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
    const myfile = new File(['foo'], 'my-img.jpg');
    mock(getAttachments).mockImplementation(() => [
      { blockKey: 'block1', entityKey: '1', src: 'my-file.pdf', title: 'My pdf' },
      { blockKey: 'block2', entityKey: '2', src: myfile, title: 'My image' }
    ]);
    const removeAttachmentSpy = jest.fn();
    const props = {
      removeAttachment: removeAttachmentSpy,
      store: {
        getEditorState: jest.fn(),
        setEditorState: jest.fn()
      }
    };
    const component = renderer.create(<Attachments {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should call removeAttachment when user clicks on delete button', () => {
    mock(getAttachments).mockImplementation(() => [{ blockKey: 'block1', entityKey: '1', src: 'my-file.pdf', title: 'My pdf' }]);
    const removeAttachmentSpy = jest.fn();
    const props = {
      removeAttachment: removeAttachmentSpy,
      store: {
        getEditorState: jest.fn(),
        setEditorState: jest.fn()
      }
    };
    const wrapper = shallow(<Attachments {...props} />);
    wrapper.find('span.assembl-icon-delete').simulate('click');
    expect(removeAttachmentSpy).toHaveBeenCalledWith({
      blockKey: 'block1',
      entityKey: '1',
      src: 'my-file.pdf',
      title: 'My pdf'
    });
  });
});