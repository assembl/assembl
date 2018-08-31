import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import renderer from 'react-test-renderer';

import EditorUtils from 'assembl-editor-utils';

import LinkButton from '../LinkButton';

configure({ adapter: new Adapter() });

jest.mock('assembl-editor-utils');

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

  beforeEach(() => {
    store.getEditorState.mockReturnValue('DUMMY_EDITOR_STATE');
    wrapper = mount(<LinkButton store={store} theme={theme} />);
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

describe('LinkButton component', () => {
  it('should render a link button', () => {
    EditorUtils.hasEntity.mockReturnValue(false);
    const onRemoveLinkAtSelectionSpy = jest.fn();
    const props = {
      modal: {
        current: null
      },
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
      modal: {
        current: null
      },
      onRemoveLinkAtSelection: onRemoveLinkAtSelectionSpy,
      store: store,
      theme: theme
    };
    const component = renderer.create(<LinkButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // TODO: test that modal is rendered in portal
  it('should render a link button with an opened modal');
});