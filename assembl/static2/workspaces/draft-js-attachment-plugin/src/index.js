// @flow
import * as React from 'react';
import decorateComponentWithProps from 'decorate-component-with-props';
import { type EditorState } from 'draft-js';

import linkConverters from './converters';
import AttachmentButton from './components/AttachmentButton';

type GetEditorState = void => EditorState;
type SetEditorState = EditorState => void;

export type Store = {
  getEditorState: ?GetEditorState,
  setEditorState: ?SetEditorState
};

export type Theme = {
  button: string,
  buttonWrapper: string
};

type Config = {
  closeModal: void => void,
  setModalContent: (React.Node, string) => void,
  theme?: Theme
};

export const converters = linkConverters;

export default (config: Config) => {
  const { closeModal, setModalContent, theme } = config;

  const store = {
    getEditorState: undefined,
    setEditorState: undefined
  };

  return {
    initialize: ({ getEditorState, setEditorState }: { getEditorState: GetEditorState, setEditorState: SetEditorState }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
    },

    AttachmentButton: decorateComponentWithProps(AttachmentButton, {
      closeModal: closeModal,
      setModalContent: setModalContent,
      ownTheme: theme,
      store: store
    })
  };
};