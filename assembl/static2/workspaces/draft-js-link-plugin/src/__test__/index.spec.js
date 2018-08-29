import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import createLinkPlugin from '../index';

configure({ adapter: new Adapter() });

describe('createLinkPlugin function', () => {
  it('should create a link plugin', () => {
    const plugin = createLinkPlugin();
    const getEditorStateSpy = jest.fn();
    const setEditorStateSpy = jest.fn();
    plugin.initialize({
      getEditorState: getEditorStateSpy,
      setEditorState: setEditorStateSpy
    });
    const DecoratedLinkButton = plugin.LinkButton;
    const wrapper = shallow(<DecoratedLinkButton />); // eslint-disable-line react/jsx-filename-extension

    wrapper.props().store.getEditorState();
    expect(getEditorStateSpy.mock.calls.length).toBe(1);
    const DummyEditorState = {};
    wrapper.props().store.setEditorState(DummyEditorState);
    expect(setEditorStateSpy.mock.calls.length).toBe(1);
    expect(setEditorStateSpy.mock.calls[0][0]).toBe(DummyEditorState);

    expect(plugin.decorators.length).toBe(1);
  });
});