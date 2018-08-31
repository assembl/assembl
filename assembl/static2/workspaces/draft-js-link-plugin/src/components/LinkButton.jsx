// @flow
import classNames from 'classnames';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { I18n } from 'react-redux-i18n';

// from workspaces
// eslint-disable-next-line import/no-extraneous-dependencies
import EditorUtils from 'assembl-editor-utils';

import AddLinkForm from './AddLinkForm';
import PluginModal from './PluginModal';
import type { DraftJSPluginStore, Theme } from '../index';

type Props = {
  modal: ?{ current: null | React.ElementRef<any> },
  store: DraftJSPluginStore,
  theme: Theme,
  onRemoveLinkAtSelection: () => void
};

type State = {
  showModal: boolean
};

type FormValues = {
  openInNewTab: boolean,
  text: string,
  url: string
};

export default class LinkButton extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  onMouseDown = (event: SyntheticMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  addLink = (values: FormValues) => {
    if (this.props.store) {
      const { getEditorState, setEditorState } = this.props.store;
      if (getEditorState && setEditorState) {
        const text = values.text ? values.text : values.url;
        const title = text;
        const data = {
          target: values.openInNewTab ? '_blank' : null,
          text: text,
          title: title,
          url: values.url
        };
        setEditorState(EditorUtils.createLinkAtSelection(getEditorState(), data));
        this.setState({ showModal: false });
      }
    }
  };

  openModal = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showModal: true });
  };

  closeModal = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showModal: false });
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
    const { modal, onRemoveLinkAtSelection, store, theme } = this.props;
    const hasLinkSelected = (store.getEditorState && EditorUtils.hasEntity(store.getEditorState(), 'LINK')) || false;
    const modalContainer = modal && modal.current;
    const buttonClassName = classNames(theme.button, { active: hasLinkSelected });
    const handleClick = hasLinkSelected ? onRemoveLinkAtSelection : this.openModal;
    return (
      <React.Fragment>
        {modalContainer &&
          this.state.showModal &&
          ReactDOM.createPortal(
            <PluginModal
              close={this.closeModal}
              closeLabel={I18n.t('common.editor.linkPlugin.addLinkForm.close')}
              title={I18n.t('common.editor.linkPlugin.addLinkForm.title')}
            >
              <AddLinkForm defaultText={this.getSelectedText()} onSubmit={this.addLink} />
            </PluginModal>,
            modalContainer
          )}
        <div className={theme.buttonWrapper} onMouseDown={this.onMouseDown}>
          <button className={buttonClassName} onClick={handleClick} type="button">
            <span className="assembl-icon-text-link" />
          </button>
        </div>
      </React.Fragment>
    );
  }
}