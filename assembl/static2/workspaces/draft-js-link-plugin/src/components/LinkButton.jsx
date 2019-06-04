// @flow
import classNames from 'classnames';
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { type EditorState } from 'draft-js';
// from workspaces
// eslint-disable-next-line import/no-extraneous-dependencies
import EditorUtils, { constants } from 'assembl-editor-utils';

import AddLinkForm, { type FormValues } from './AddLinkForm';
import type { DraftJSPluginStore, Theme } from '../index';

const { ENTITY_TYPES } = constants;

type GetEditorState = void => EditorState;
type SetEditorState = EditorState => void;

type Props = {
  closeModal: void => void,
  setModalContent: (React.Node, string) => void,
  store: DraftJSPluginStore,
  theme: Theme,
  onRemoveLinkAtSelection: () => void,
  formatLink?: string => string,
  setEditorState?: SetEditorState,
  getEditorState?: GetEditorState
};

export default class LinkButton extends React.Component<Props> {
  onMouseDown = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  addLink = (values: FormValues) => {
    const { closeModal, store, formatLink } = this.props;
    const editorState = this.getEditorState();
    if (editorState) {
      const setEditorState = (store && store.setEditorState) || this.props.setEditorState;
      if (setEditorState) {
        if (values.url) {
          const text = values.text ? values.text : values.url;
          const data = {
            target: values.openInNewTab ? '_blank' : null,
            text: text,
            title: text,
            url: formatLink ? formatLink(values.url) : values.url
          };
          setEditorState(EditorUtils.createLinkAtSelection(editorState, data));
        }
      }
    }
    closeModal();
  };

  openModal = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const body = <AddLinkForm initialValues={{ text: this.getSelectedText() }} onSubmit={this.addLink} />;
    const title = I18n.t('common.editor.linkPlugin.title');
    this.props.setModalContent(body, title);
  };

  getSelectedText = (): string => {
    const editorState = this.getEditorState();
    if (editorState) {
      const selectionState = editorState.getSelection();
      const anchorKey = selectionState.getAnchorKey();
      const currentContent = editorState.getCurrentContent();
      const currentContentBlock = currentContent.getBlockForKey(anchorKey);
      const [start, end] = [selectionState.getStartOffset(), selectionState.getEndOffset()];
      return currentContentBlock.getText().slice(start, end);
    }
    return '';
  };

  getEditorState(): EditorState | null {
    const { getEditorState, store } = this.props;
    if (getEditorState) {
      return getEditorState();
    } else if (store.getEditorState) {
      return store.getEditorState();
    }
    return null;
  }

  render() {
    const { onRemoveLinkAtSelection, theme } = this.props;
    const editorState = this.getEditorState();
    const hasLinkSelected = (editorState && EditorUtils.hasEntity(editorState, ENTITY_TYPES.link)) || false;
    const buttonClassName = classNames(theme.button, { active: hasLinkSelected });
    const handleClick = hasLinkSelected ? onRemoveLinkAtSelection : this.openModal;
    return (
      <div className={theme.buttonWrapper} onMouseDown={this.onMouseDown}>
        <button className={buttonClassName} onClick={handleClick} type="button">
          <span className="assembl-icon-text-link" />
        </button>
      </div>
    );
  }
}