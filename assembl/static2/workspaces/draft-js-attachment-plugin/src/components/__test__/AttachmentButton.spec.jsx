import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line
import React from 'react';
import renderer from 'react-test-renderer';
import { EditorState } from 'draft-js';

import EditorUtils from 'assembl-editor-utils';

import AttachmentButton from '../AttachmentButton';
import AddAttachmentForm from '../AddAttachmentForm';
import addAttachment from '../../modifiers/addAttachment';

configure({ adapter: new Adapter() });

jest.mock('assembl-editor-utils');
jest.mock('../AddAttachmentForm', () => 'AddAttachmentForm');
jest.mock('../../modifiers/addAttachment');

const store = {
  getEditorState: jest.fn(),
  setEditorState: jest.fn()
};

const theme = {
  button: 'btn',
  buttonWrapper: 'btn-group'
};

describe('addAttachment method', () => {
  let wrapper;
  const closeModalSpy = jest.fn();
  const setModalContentSpy = jest.fn();

  beforeEach(() => {
    store.getEditorState.mockReturnValue('DUMMY_EDITOR_STATE');
    wrapper = mount(
      <AttachmentButton closeModal={closeModalSpy} setModalContent={setModalContentSpy} store={store} theme={theme} />
    );
  });

  it('should only close modal if no file is provided', () => {
    const values = { file: null };
    wrapper.instance().addAttachment(values);
    expect(addAttachment).not.toHaveBeenCalled();
    expect(closeModalSpy).toHaveBeenCalled();
  });

  it('should add an attachment', () => {
    const values = {
      file: {
        externalUrl: 'my_file.jpg',
        mimeType: 'image/jpeg',
        imgTitle: 'My file'
      }
    };
    wrapper.instance().addAttachment(values);
    const expectedData = {
      id: '',
      mimeType: 'image/jpeg',
      src: 'my_file.jpg',
      title: 'My file'
    };
    expect(addAttachment).toHaveBeenCalledWith('DUMMY_EDITOR_STATE', expectedData);
    expect(closeModalSpy).toHaveBeenCalled();
  });
});

describe('AttachmentButton component', () => {
  const closeModalSpy = jest.fn();
  const setModalContentSpy = jest.fn();
  let jsx;

  beforeEach(() => {
    store.getEditorState.mockReturnValue(EditorState.createEmpty());
    const props = {
      closeModal: closeModalSpy,
      store: store,
      setModalContent: setModalContentSpy,
      theme: theme
    };
    jsx = <AttachmentButton {...props} />;
  });

  it('should open a modal that contains AddAttachmentForm on click', () => {
    store.getEditorState.mockReturnValue(EditorState.createEmpty());
    const wrapper = shallow(jsx);
    const eventMock = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    wrapper.find('button').simulate('click', eventMock);
    expect(eventMock.preventDefault).toHaveBeenCalled();
    expect(eventMock.stopPropagation).toHaveBeenCalled();
    expect(setModalContentSpy).toHaveBeenCalledWith(
      <AddAttachmentForm onSubmit={wrapper.instance().addAttachment} />,
      'Add an attachment'
    );
  });

  it('should prevent default onMouseDown', () => {
    store.getEditorState.mockReturnValue(EditorState.createEmpty());
    const wrapper = shallow(jsx);
    const eventMock = {
      preventDefault: jest.fn()
    };
    wrapper.find('div').simulate('mouseDown', eventMock);
    expect(eventMock.preventDefault).toHaveBeenCalled();
  });

  it('should render an attachment button', () => {
    EditorUtils.hasEntity.mockReturnValue(false);
    const props = {
      store: store,
      theme: theme
    };
    const component = renderer.create(<AttachmentButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});