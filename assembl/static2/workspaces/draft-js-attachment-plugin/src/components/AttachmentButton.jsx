// @flow
import classNames from 'classnames';
import * as React from 'react';
import { I18n } from 'react-redux-i18n';

import AddAttachmentForm, { type AddAttachmentFormValues } from './AddAttachmentForm';
import addAttachment from '../modifiers/addAttachment';
import type { Store, Theme } from '../index';

type Props = {
  closeModal: void => void,
  hasAttachmentSelected: boolean,
  setModalContent: (React.Node, string) => void,
  store: Store,
  theme: Theme
};

class AttachmentButton extends React.Component<Props> {
  onMouseDown = (e: SyntheticMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  addAttachment = (values: AddAttachmentFormValues) => {
    const { closeModal, store } = this.props;
    const { getEditorState, setEditorState } = store;
    if (getEditorState && setEditorState && values.file) {
      setEditorState(
        addAttachment(getEditorState(), {
          mimeType: values.file.mimeType,
          src: values.file.externalUrl,
          title: values.file.imgTitle
        })
      );
    }
    closeModal();
  };

  handleClick = (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const body = <AddAttachmentForm onSubmit={this.addAttachment} />;
    const title = I18n.t('common.editor.attachmentPlugin.title');
    this.props.setModalContent(body, title);
  };

  render() {
    const { hasAttachmentSelected, theme } = this.props;
    const buttonClassName = classNames(theme.button, { active: hasAttachmentSelected });
    // const handleClick = hasLinkSelected ? onRemoveLinkAtSelection : this.handleClick;
    return (
      <div className={theme.buttonWrapper} onMouseDown={this.onMouseDown}>
        <button className={buttonClassName} onClick={this.handleClick} type="button">
          <span className="assembl-icon-text-attachment" />
        </button>
      </div>
    );
  }
}

export default AttachmentButton;