// @flow
import * as React from 'react';
import { EditorState, RichUtils } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import classNames from 'classnames';
import createToolbarPlugin from 'draft-js-static-toolbar-plugin';
import { HeadlineThreeButton, HeadlineTwoButton } from 'draft-js-buttons';
// from our workspaces
/* eslint-disable import/no-extraneous-dependencies */
import createSideToolbarPlugin from 'draft-js-side-toolbar-plugin';
import createAttachmentPlugin from 'draft-js-attachment-plugin';
import createLinkPlugin from 'draft-js-link-plugin';
import createModalPlugin from 'draft-js-modal-plugin';
/* eslint-enable import/no-extraneous-dependencies */
import { BoldButton, ItalicButton, UnorderedListButton } from './buttons';
import { addProtocol } from '../../../utils/linkify';

type DraftPlugin = any;

type Props = {
  editorState: EditorState,
  handleInputFocus?: Function,
  onChange: Function,
  placeholder?: string,
  textareaRef?: Function,
  toolbarPosition: string,
  withAttachmentButton: boolean,
  withSideToolbar?: boolean
};

type State = {
  editorHasFocus: boolean
};

export default class RichTextEditor extends React.Component<Props, State> {
  editor: ?Editor;

  plugins: Array<DraftPlugin>;

  components: { [string]: React.ComponentType<*> };

  static defaultProps = {
    handleInputFocus: undefined,
    toolbarPosition: 'top',
    withAttachmentButton: false,
    withSideToolbar: false
  };

  constructor(props: Props): void {
    super(props);
    this.editor = React.createRef();
    const modalPlugin = createModalPlugin();
    const { closeModal, setModalContent, Modal } = modalPlugin;
    const modalConfig = {
      closeModal: closeModal,
      setModalContent: setModalContent
    };
    const linkPlugin = createLinkPlugin({
      ...modalConfig,
      formatLink: addProtocol
    });
    const { LinkButton } = linkPlugin;

    const components = {};
    components.Modal = Modal;
    const toolbarStructure = [BoldButton, ItalicButton, UnorderedListButton, LinkButton];
    const plugins = [linkPlugin];

    if (props.withAttachmentButton) {
      const attachmentPlugin = createAttachmentPlugin({
        ...modalConfig
      });
      const { AttachmentButton, Attachments } = attachmentPlugin;
      toolbarStructure.push(AttachmentButton);
      plugins.push(attachmentPlugin);
      components.Attachments = Attachments;
      components.AttachmentButton = AttachmentButton;
    }
    if (props.withSideToolbar) {
      const sideToolbarPlugin = createSideToolbarPlugin({
        structure: toolbarStructure
      });
      plugins.push(sideToolbarPlugin);

      const { SideToolbar } = sideToolbarPlugin;
      this.components = {
        SideToolbar: SideToolbar,
        ...components
      };
    } else {
      const staticToolbarPlugin = createToolbarPlugin({
        structure: toolbarStructure,
        // we need this for toolbar plugin to add css classes to buttons and toolbar
        theme: {
          buttonStyles: {
            active: 'active',
            button: 'btn btn-default',
            buttonWrapper: 'btn-group'
          },
          toolbarStyles: {
            toolbar: classNames('editor-toolbar', props.toolbarPosition)
          }
        }
      });
      plugins.push(staticToolbarPlugin);

      const { Toolbar } = staticToolbarPlugin;
      this.components = {
        Toolbar: Toolbar,
        ...components
      };
    }
    this.plugins = plugins;

    this.state = {
      editorHasFocus: false
    };
  }

  handleEditorFocus = (): void => {
    const { handleInputFocus } = this.props;
    this.setState(
      {
        editorHasFocus: true
      },
      handleInputFocus
    );
  };

  shouldHidePlaceholder(): boolean {
    // don't display placeholder if user changes the block type (to bullet list) before to type anything
    const contentState = this.props.editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (
        contentState
          .getBlockMap()
          .first()
          .getType() !== 'unstyled'
      ) {
        return true;
      }
    }
    return false;
  }

  focusEditor = (): void => {
    // Hacky: Wait to focus the editor so we don't lose selection.
    // The toolbar actions don't work at all without this.
    setTimeout(() => {
      if (this.editor && this.editor.current) {
        this.editor.current.focus();
      }
    }, 50);
  };

  handleReturn = (e: SyntheticKeyboardEvent<*>): 'handled' | 'not-handled' => {
    // Pressing shift-enter keys creates a new line (<br/>) instead of an new paragraph (<p>)
    // See https://github.com/HubSpot/draft-convert/issues/83
    // For example, this enables to create line returns inside a list item.
    const { editorState, onChange } = this.props;
    if (e.shiftKey) {
      onChange(RichUtils.insertSoftNewline(editorState));
      return 'handled';
    }
    return 'not-handled';
  };

  render() {
    const { editorState, onChange, placeholder, textareaRef } = this.props;
    const divClassName = classNames('rich-text-editor', { hidePlaceholder: this.shouldHidePlaceholder() });
    const { Attachments, AttachmentButton, Modal, SideToolbar, Toolbar } = this.components;
    return (
      <div className={divClassName} ref={textareaRef}>
        <div className="editor-header">
          {editorState.getCurrentContent().hasText() && placeholder ? (
            <div className="editor-label form-label">{placeholder}</div>
          ) : (
            <div className="editor-label form-label">&nbsp;</div>
          )}
          <div className="clear" />
        </div>
        <Modal />
        <div onClick={this.focusEditor}>
          <Editor
            editorState={editorState}
            onChange={onChange}
            onFocus={this.handleEditorFocus}
            placeholder={placeholder}
            plugins={this.plugins}
            ref={this.editor}
            handleReturn={this.handleReturn}
            spellCheck
          />
        </div>
        {/*
          we have to move toolbar in css for now since there is a bug in draft-js-plugin
          It should be fixed in draft-js-plugin v3
         */}
        {Toolbar ? <Toolbar /> : null}
        {SideToolbar ? (
          <SideToolbar>
            {externalProps => (
              <div>
                <HeadlineTwoButton {...externalProps} />
                <HeadlineThreeButton {...externalProps} />
                <BoldButton {...externalProps} />
                <ItalicButton {...externalProps} />
                <UnorderedListButton {...externalProps} />
                <AttachmentButton {...externalProps} />
                {/* <LinkButton {...externalProps} /> */}
              </div>
            )}
          </SideToolbar>
        ) : null}
        {Attachments ? <Attachments /> : null}
      </div>
    );
  }
}