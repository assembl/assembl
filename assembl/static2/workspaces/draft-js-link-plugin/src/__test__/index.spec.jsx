// @flow
import { ContentState } from 'draft-js';
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line
import { constants } from 'assembl-editor-utils';

import createLinkPlugin from '../index';
import linkStrategy, { matchesEntityType } from '../linkStrategy';

jest.mock('../linkStrategy');

configure({ adapter: new Adapter() });

const { ENTITY_TYPES } = constants;

describe('createLinkPlugin function', () => {
  it('should create a decorator for links', () => {
    const closeModalSpy = jest.fn();
    const setModalContentSpy = jest.fn();
    const plugin = createLinkPlugin({
      closeModal: closeModalSpy,
      setModalContent: setModalContentSpy
    });
    expect(plugin.decorators.length).toBe(1);
    const linkDecorator = plugin.decorators[0];
    const contentState = ContentState.createFromText('foobar');
    const callbackSpy = jest.fn();
    linkDecorator.strategy(contentState.getFirstBlock(), callbackSpy, contentState);
    expect(linkStrategy).toHaveBeenCalled();

    linkDecorator.matchesEntityType(ENTITY_TYPES.link);
    expect(matchesEntityType).toHaveBeenCalled();

    const DecoratedLink = linkDecorator.component;
    const wrapper = shallow(<DecoratedLink />);
    wrapper.props().closeModal();
    expect(closeModalSpy).toHaveBeenCalled();
    wrapper.props().setModalContent('dummy content');
    expect(setModalContentSpy).toHaveBeenCalledWith('dummy content');
  });

  it('should create a decorated link button', () => {
    const closeModalSpy = jest.fn();
    const setModalContentSpy = jest.fn();
    const plugin = createLinkPlugin({
      closeModal: closeModalSpy,
      setModalContent: setModalContentSpy
    });
    const getEditorStateSpy = jest.fn();
    const setEditorStateSpy = jest.fn();
    plugin.initialize({
      getEditorState: getEditorStateSpy,
      setEditorState: setEditorStateSpy
    });
    const DecoratedLinkButton = plugin.LinkButton;
    const wrapper = shallow(<DecoratedLinkButton />);

    wrapper.props().store.getEditorState();
    expect(getEditorStateSpy.mock.calls.length).toBe(1);
    const DummyEditorState = {};
    wrapper.props().store.setEditorState(DummyEditorState);
    expect(setEditorStateSpy.mock.calls.length).toBe(1);
    expect(setEditorStateSpy.mock.calls[0][0]).toBe(DummyEditorState);

    wrapper.props().closeModal();
    expect(closeModalSpy).toHaveBeenCalled();

    wrapper.props().setModalContent('dummy content');
    expect(setModalContentSpy).toHaveBeenCalledWith('dummy content');
  });
});