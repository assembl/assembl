// @flow
import classNames from 'classnames';
import * as React from 'react';
import { I18n } from 'react-redux-i18n';

// from workspaces
// eslint-disable-next-line import/no-extraneous-dependencies
import EditorUtils from 'assembl-editor-utils';

import AddLinkForm, { type FormValues } from './AddLinkForm';
import type { DraftJSPluginStore, Theme } from '../index';

type Props = {
  closeModal: void => void,
  setModalContent: (React.Node, string) => void,
  store: DraftJSPluginStore,
  theme: Theme,
  onRemoveLinkAtSelection: () => void
};

export default class LinkButton extends React.Component<Props> {
  onMouseDown = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  addLink = (values: FormValues) => {
    const { closeModal, store } = this.props;
    if (store) {
      const { getEditorState, setEditorState } = store;
      if (getEditorState && setEditorState) {
        if (values.url) {
          const text = values.text ? values.text : values.url;
          const title = text;
          const data = {
            target: values.openInNewTab ? '_blank' : null,
            text: text,
            title: title,
            url: values.url
          };
          setEditorState(EditorUtils.createLinkAtSelection(getEditorState(), data));
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

  getSelectedText = () => {
    const { store } = this.props;
    if (!store.getEditorState) {
      return '';
    }

    const editorState = store.getEditorState();
    const selectionState = editorState.getSelection();
    const anchorKey = selectionState.getAnchorKey();
    const currentContent = editorState.getCurrentContent();
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const selectedText = currentContentBlock.getText().slice(start, end);
    return selectedText;
  };

  render() {
    const { onRemoveLinkAtSelection, store, theme } = this.props;
    const hasLinkSelected = (store.getEditorState && EditorUtils.hasEntity(store.getEditorState(), 'LINK')) || false;
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