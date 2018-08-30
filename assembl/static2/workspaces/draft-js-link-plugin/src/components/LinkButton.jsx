// @flow
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
  theme: Theme
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
        const data = {
          target: values.openInNewTab ? '_blank' : null,
          text: values.text,
          title: values.text,
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
    const { modal, theme } = this.props;
    const modalContainer = modal && modal.current;
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
          <button className={theme.button} onClick={this.openModal} type="button">
            <span className="assembl-icon-text-link" />
          </button>
        </div>
      </React.Fragment>
    );
  }
}