// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { EditorState, RichUtils } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import classNames from 'classnames';
import createToolbarPlugin from 'draft-js-static-toolbar-plugin';
import { ItalicButton, BoldButton, UnorderedListButton } from 'draft-js-buttons';
import createCounterPlugin from 'draft-js-counter-plugin';

// from our workspaces
/* eslint-disable import/no-extraneous-dependencies */
import createAttachmentPlugin from 'draft-js-attachment-plugin';
import createLinkPlugin from 'draft-js-link-plugin';
import createModalPlugin from 'draft-js-modal-plugin';
/* eslint-enable import/no-extraneous-dependencies */

type DraftPlugin = any;

type Props = {
  editorState: EditorState,
  handleInputFocus?: Function,
  maxLength: number,
  onChange: Function,
  placeholder?: string,
  textareaRef?: Function,
  toolbarPosition: string,
  withAttachmentButton: boolean
};

type State = {
  editorHasFocus: boolean
};

const ToolbarSeparator = () => <span className="separator" />;

export default class RichTextEditor extends React.Component<Props, State> {
  editor: ?Editor;

  plugins: Array<DraftPlugin>;

  components: { [string]: React.ComponentType<*> };

  static defaultProps = {
    handleInputFocus: undefined,
    maxLength: 0,
    toolbarPosition: 'top',
    withAttachmentButton: false
  };

  constructor(props: Props): void {
    super(props);
    const modalPlugin = createModalPlugin();
    const { closeModal, setModalContent, Modal } = modalPlugin;
    const counterPlugin = createCounterPlugin();
    const modalConfig = {
      closeModal: closeModal,
      setModalContent: setModalContent
    };
    const linkPlugin = createLinkPlugin({
      ...modalConfig
    });
    const { LinkButton } = linkPlugin;

    const components = {};
    const toolbarStructure = [BoldButton, ItalicButton, UnorderedListButton, ToolbarSeparator, LinkButton, ToolbarSeparator];
    const plugins = [counterPlugin, linkPlugin];
    if (props.withAttachmentButton) {
      const attachmentPlugin = createAttachmentPlugin({
        ...modalConfig
      });
      const { AttachmentButton, Attachments } = attachmentPlugin;
      toolbarStructure.push(AttachmentButton);
      plugins.push(attachmentPlugin);
      components.Attachments = Attachments;
    }

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
          toolbar: 'editor-toolbar'
        }
      }
    });
    plugins.push(staticToolbarPlugin);

    this.plugins = plugins;
    const { CustomCounter } = counterPlugin;
    const { Toolbar } = staticToolbarPlugin;
    this.components = {
      CustomCounter: CustomCounter,
      Modal: Modal,
      Toolbar: Toolbar,
      ...components
    };

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

  countRemainingChars = (plainText: string): string => {
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, '').trim(); // replace above characters w/ nothing
    const count = this.props.maxLength - cleanString.length;
    return I18n.t('debate.remaining_x_characters', { nbCharacters: count });
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
      if (this.editor) {
        this.editor.focus();
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
    const { editorState, maxLength, onChange, placeholder, textareaRef, toolbarPosition } = this.props;
    const divClassName = classNames('rich-text-editor', { hidePlaceholder: this.shouldHidePlaceholder() });
    const { Attachments, CustomCounter, Modal, Toolbar } = this.components;
    return (
      <div className={divClassName} ref={textareaRef}>
        <div className="editor-header">
          {editorState.getCurrentContent().hasText() ? <div className="editor-label form-label">{placeholder}</div> : null}
          {toolbarPosition === 'top' ? <Toolbar /> : null}
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
            ref={(e) => {
              this.editor = e;
            }}
            handleReturn={this.handleReturn}
            spellCheck
          />
        </div>
        {maxLength ? (
          <div className="annotation margin-xs">
            <CustomCounter limit={maxLength} countFunction={this.countRemainingChars} />
          </div>
        ) : null}
        {toolbarPosition === 'bottom' ? <Toolbar /> : null}
        {Attachments ? <Attachments /> : null}
      </div>
    );
  }
}