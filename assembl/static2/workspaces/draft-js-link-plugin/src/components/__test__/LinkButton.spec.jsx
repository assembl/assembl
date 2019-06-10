import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line
import React from 'react';
import renderer from 'react-test-renderer';
import { EditorState } from 'draft-js';

import EditorUtils from 'assembl-editor-utils';

import LinkButton from '../LinkButton';
import AddLinkForm from '../AddLinkForm';

configure({ adapter: new Adapter() });

jest.mock('assembl-editor-utils');
jest.mock('../AddLinkForm', () => 'AddLinkForm');

const store = {
  getEditorState: jest.fn(),
  setEditorState: jest.fn()
};

const theme = {
  button: 'btn',
  buttonWrapper: 'btn-group'
};

describe('addLink method', () => {
  let wrapper;
  const closeModalSpy = jest.fn();
  const setModalContentSpy = jest.fn();

  beforeEach(() => {
    store.getEditorState.mockReturnValue('DUMMY_EDITOR_STATE');
    wrapper = mount(<LinkButton closeModal={closeModalSpy} setModalContent={setModalContentSpy} store={store} theme={theme} />);
  });

  it('should only close modal if no url is provided', () => {
    const values = { text: 'Foo' };
    wrapper.instance().addLink(values);
    expect(EditorUtils.createLinkAtSelection).not.toHaveBeenCalled();
    expect(closeModalSpy).toHaveBeenCalled();
  });

  it('should use create a link at selection with target/text/title/url', () => {
    const values = {
      openInNewTab: true,
      text: 'GNU is not Unix',
      url: 'http://www.gnu.org'
    };
    wrapper.instance().addLink(values);
    const expectedData = {
      target: '_blank',
      text: 'GNU is not Unix',
      title: 'GNU is not Unix',
      url: 'http://www.gnu.org'
    };
    expect(EditorUtils.createLinkAtSelection).toHaveBeenCalledWith('DUMMY_EDITOR_STATE', expectedData);
  });

  it('should use url for text and title if these are not set', () => {
    const values = {
      url: 'http://www.gnu.org'
    };
    wrapper.instance().addLink(values);
    const expectedData = {
      target: null,
      text: 'http://www.gnu.org',
      title: 'http://www.gnu.org',
      url: 'http://www.gnu.org'
    };
    expect(EditorUtils.createLinkAtSelection).toHaveBeenCalledWith('DUMMY_EDITOR_STATE', expectedData);
  });
});

describe('getSelectedText method', () => {
  xit('should get selected text', () => {});
});

describe('LinkButton component', () => {
  it('should open a modal that contains AddLinkForm on click', () => {
    const closeModalSpy = jest.fn();
    const setModalContentSpy = jest.fn();
    store.getEditorState.mockReturnValue(EditorState.createEmpty());
    const wrapper = shallow(
      <LinkButton closeModal={closeModalSpy} setModalContent={setModalContentSpy} store={store} theme={theme} />
    );
    const eventMock = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    wrapper.find('button').simulate('click', eventMock);
    expect(eventMock.preventDefault).toHaveBeenCalled();
    expect(eventMock.stopPropagation).toHaveBeenCalled();
    expect(setModalContentSpy).toHaveBeenCalledWith(
      <AddLinkForm initialValues={{ text: '' }} onSubmit={wrapper.instance().addLink} />,
      'Insert a link'
    );
  });

  it('should render a link button', () => {
    EditorUtils.hasEntity.mockReturnValue(false);
    const onRemoveLinkAtSelectionSpy = jest.fn();
    const props = {
      onRemoveLinkAtSelection: onRemoveLinkAtSelectionSpy,
      store: store,
      theme: theme
    };
    const component = renderer.create(<LinkButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an active LinkButton if selection is on a link', () => {
    EditorUtils.hasEntity.mockReturnValue(true);
    const onRemoveLinkAtSelectionSpy = jest.fn();
    const props = {
      onRemoveLinkAtSelection: onRemoveLinkAtSelectionSpy,
      store: store,
      theme: theme
    };
    const component = renderer.create(<LinkButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});