// @flow
import * as React from 'react';
import decorateComponentWithProps from 'decorate-component-with-props';
import { type ContentBlock, type EditorState } from 'draft-js';
import get from 'lodash/get';

import linkConverters from './converters';
import AttachmentButton from './components/AttachmentButton';
import DocumentIcon from './components/DocumentIcon';
import Image from './components/Image';

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
    blockRendererFn: (
      block: ContentBlock,
      { getEditorState }: { getEditorState: GetEditorState, setEditorState: SetEditorState }
    ) => {
      if (block.getType() === 'atomic') {
        const entityKey = block.getEntityAt(0);
        const entity = getEditorState()
          .getCurrentContent()
          .getEntity(entityKey);
        const typeComponentMapping = {
          DOCUMENT: DocumentIcon,
          IMAGE: Image
        };

        const component = get(typeComponentMapping, entity.getType(), null);
        if (component) {
          return {
            component: component,
            editable: false
          };
        }
      }

      return null;
    },
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