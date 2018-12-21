// @flow
import { type EditorState } from 'draft-js';
import * as React from 'react';
import { I18n } from 'react-redux-i18n';

// from workspaces
// eslint-disable-next-line import/no-extraneous-dependencies
import EditorUtils from 'assembl-editor-utils';

import AddLinkForm, { type FormValues } from './AddLinkForm';

type Props = {
  children: React.Node,
  className: string,
  closeModal: void => void,
  entityKey: string,
  getEditorState: void => EditorState,
  setEditorState: EditorState => void,
  setModalContent: (React.Node, string) => void,
  formatLink?: string => string
};

type State = {
  displayModal: boolean
};

class Link extends React.PureComponent<Props, State> {
  openModal = (e: SyntheticEvent<HTMLButtonElement>, initialValues: FormValues) => {
    e.preventDefault();
    e.stopPropagation();
    const body = <AddLinkForm initialValues={initialValues} onSubmit={this.editLink} />;
    const title = I18n.t('common.editor.linkPlugin.editLinkForm.title');
    this.props.setModalContent(body, title);
  };

  editLink = (values: FormValues) => {
    const { closeModal, getEditorState, setEditorState, formatLink } = this.props;
    if (getEditorState && setEditorState && values.url) {
      const text = values.text ? values.text : values.url;
      const title = text;
      const data = {
        target: values.openInNewTab ? '_blank' : null,
        text: text,
        title: title,
        url: formatLink ? formatLink(values.url) : values.url
      };
      setEditorState(EditorUtils.replaceLinkAtCursor(getEditorState(), data));
    }
    closeModal();
  };

  render() {
    const { children, className, entityKey, getEditorState, formatLink } = this.props;
    const entity = getEditorState()
      .getCurrentContent()
      .getEntity(entityKey);
    const entityData = entity ? entity.get('data') : undefined;
    const href = (entityData && entityData.url) || undefined;
    const formatedHref = formatLink && href ? formatLink(href) : href;
    const target = (entityData && entityData.target) || undefined;
    const text = (entityData && entityData.text) || '';
    const title = (entityData && entityData.title) || undefined;
    const initialValues = {
      openInNewTab: target === '_blank',
      text: text,
      title: title,
      url: formatedHref
    };
    return (
      <a
        onClick={e => this.openModal(e, initialValues)}
        className={className}
        title={title}
        href={formatedHref}
        target={target}
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
}

export default Link;