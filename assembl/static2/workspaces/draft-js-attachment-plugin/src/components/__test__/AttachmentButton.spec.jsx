import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import renderer from 'react-test-renderer';
import { EditorState } from 'draft-js';

import EditorUtils from 'assembl-editor-utils';

import AttachmentButton from '../AttachmentButton';
import AddAttachmentForm from '../AddAttachmentForm';

configure({ adapter: new Adapter() });

jest.mock('assembl-editor-utils');
jest.mock('../AddAttachmentForm', () => 'AddAttachmentForm');

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

  it('should only close modal if no url is provided', () => {
    const values = { text: 'Foo' };
    wrapper.instance().addAttachment(values);
    expect(EditorUtils.createAttachmentAtSelection).not.toHaveBeenCalled();
    expect(closeModalSpy).toHaveBeenCalled();
  });

  it('should use create a link at selection with target/text/title/url', () => {
    const values = {
      openInNewTab: true,
      text: 'GNU is not Unix',
      url: 'http://www.gnu.org'
    };
    wrapper.instance().addAttachment(values);
    const expectedData = {
      target: '_blank',
      text: 'GNU is not Unix',
      title: 'GNU is not Unix',
      url: 'http://www.gnu.org'
    };
    expect(EditorUtils.createAttachmentAtSelection).toHaveBeenCalledWith('DUMMY_EDITOR_STATE', expectedData);
  });

  it('should use url for text and title if these are not set', () => {
    const values = {
      url: 'http://www.gnu.org'
    };
    wrapper.instance().addAttachment(values);
    const expectedData = {
      target: null,
      text: 'http://www.gnu.org',
      title: 'http://www.gnu.org',
      url: 'http://www.gnu.org'
    };
    expect(EditorUtils.createAttachmentAtSelection).toHaveBeenCalledWith('DUMMY_EDITOR_STATE', expectedData);
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

  // it('should render an active AttachmentButton if selection is on a link', () => {
  //   EditorUtils.hasEntity.mockReturnValue(true);
  //   const props = {
  //     modal: {
  //       current: null
  //     },
  //     // onRemoveLinkAtSelection: onRemoveLinkAtSelectionSpy,
  //     store: store,
  //     theme: theme
  //   };
  //   const component = renderer.create(<LinkButton {...props} />);
  //   const tree = component.toJSON();
  //   expect(tree).toMatchSnapshot();
  // });
});