// @flow
import * as React from 'react';
import decorateComponentWithProps from 'decorate-component-with-props';
import { type EditorState } from 'draft-js';

import LinkButton from './components/LinkButton';

type GetEditorState = void => EditorState;
type SetEditorState = EditorState => void;

export type DraftJSPluginStore = {
  getEditorState: ?GetEditorState,
  setEditorState: ?SetEditorState
};

export type Theme = {
  button: string,
  buttonWrapper: string
};

type Config = {
  modal?: ?{ current: null | React.ElementRef<any> },
  theme?: Theme
};

export default (config: Config = {}) => {
  const { modal, theme } = config;

  const store = {
    getEditorState: undefined,
    setEditorState: undefined
  };

  return {
    initialize: ({ getEditorState, setEditorState }: { getEditorState: GetEditorState, setEditorState: SetEditorState }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
    },

    LinkButton: decorateComponentWithProps(LinkButton, {
      modal: modal,
      ownTheme: theme,
      store: store
    })
  };
};