// @flow
import * as React from 'react';
import decorateComponentWithProps from 'decorate-component-with-props';
import { type EditorState } from 'draft-js';

import createStore from './utils/createStore';
import Modal from './components/Modal';

type GetEditorState = void => EditorState;
type SetEditorState = EditorState => void;

export default () => {
  const store = createStore({ content: null });

  return {
    initialize: ({ getEditorState, setEditorState }: { getEditorState: GetEditorState, setEditorState: SetEditorState }) => {
      store.updateItem('getEditorState', getEditorState);
      store.updateItem('setEditorState', setEditorState);
    },

    setModalContent: (body: React.Node, title: string) => {
      store.updateItem('content', {
        body: body,
        title: title
      });
    },

    closeModal: function () {
      store.updateItem('content', null);
    },

    Modal: decorateComponentWithProps(Modal, {
      store: store,
      close: (e) => {
        e.preventDefault();
        store.updateItem('content', null);
      }
    })
  };
};