// @flow
/*
  Note that this component is fully uncontrolled
  Warning: you need to set a key on it to specify if editor state is empty or not
  Therefore, react will recreate the editor if the status (empty/not empty) changes
*/
// eslint-disable-next-line
// See https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#recommendation-fully-uncontrolled-component-with-a-key

import * as React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Editor, EditorState, RichUtils } from 'draft-js';
import classNames from 'classnames';
import punycode from 'punycode';

import AtomicBlockRenderer from './atomicBlockRenderer';
import Toolbar from './toolbar';
import type { ButtonConfigType } from './buttonConfigType';
import EditAttachments from '../editAttachments';
import attachmentsPlugin from './attachmentsPlugin';

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

type RichTextEditorState = {
  editorHasFocus: boolean
};

function customBlockRenderer(block) {
  if (block.getType() === 'atomic') {
    return {
      component: AtomicBlockRenderer,
      editable: false
    };
  }

  return null;
}

export default class RichTextEditor extends React.Component<Props, RichTextEditorState> {
  editor: ?Editor;

  static defaultProps = {
    handleInputFocus: undefined,
    maxLength: 0,
    toolbarPosition: 'top',
    withAttachmentButton: false
  };

  constructor(props: Props): void {
    super(props);
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

  getToolbarButtons(): Array<ButtonConfigType> {
    const bold = {
      id: 'bold',
      icon: 'text-bold',
      label: I18n.t('common.editor.bold'),
      type: 'style',
      style: 'BOLD'
    };
    const italic = {
      id: 'italic',
      icon: 'text-italics',
      label: I18n.t('common.editor.italic'),
      type: 'style',
      style: 'ITALIC'
    };
    const bullets = {
      id: 'bullets',
      icon: 'text-bullets',
      label: I18n.t('common.editor.bulletList'),
      type: 'block-type',
      style: 'unordered-list-item'
    };
    const buttons = [bold, italic, bullets];
    return buttons;
  }

  getCharCount(editorState: EditorState): number {
    // this code is "borrowed" from the draft-js counter plugin
    const decodeUnicode = str => punycode.ucs2.decode(str); // func to handle unicode characters
    const plainText = editorState.getCurrentContent().getPlainText('');
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, '').trim(); // replace above characters w/ nothing
    return decodeUnicode(cleanString).length;
  }

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

  renderRemainingChars = (): React.Element<any> => {
    const { editorState, maxLength } = this.props;
    const charCount = this.getCharCount(editorState);
    const remainingChars = maxLength - charCount;
    return (
      <div className="annotation margin-xs">
        <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
      </div>
    );
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

  deleteAttachment = (documentId: string): void => {
    const { editorState, onChange } = this.props;
    const contentState = editorState.getCurrentContent();
    const newContentState = attachmentsPlugin.removeAttachment(contentState, documentId);
    onChange(EditorState.createWithContent(newContentState));
  };

  renderToolbar = () => {
    const { editorState, onChange, withAttachmentButton } = this.props;
    return (
      <Toolbar
        buttonsConfig={this.getToolbarButtons()}
        editorState={editorState}
        focusEditor={this.focusEditor}
        onChange={onChange}
        withAttachmentButton={withAttachmentButton}
      />
    );
  };

  render() {
    const { editorState, maxLength, onChange, placeholder, textareaRef, toolbarPosition } = this.props;
    const divClassName = classNames('rich-text-editor', { hidePlaceholder: this.shouldHidePlaceholder() });
    const attachments = attachmentsPlugin.getAttachments(editorState);
    return (
      <div className={divClassName} ref={textareaRef}>
        <div className="editor-header">
          {editorState.getCurrentContent().hasText() ? <div className="editor-label form-label">{placeholder}</div> : null}
          {toolbarPosition === 'top' ? this.renderToolbar() : null}
          <div className="clear" />
        </div>
        <div onClick={this.focusEditor}>
          <Editor
            blockRendererFn={customBlockRenderer}
            editorState={editorState}
            onChange={onChange}
            onFocus={this.handleEditorFocus}
            placeholder={placeholder}
            ref={(e) => {
              this.editor = e;
            }}
            handleReturn={this.handleReturn}
            spellCheck
          />
        </div>
        {maxLength ? this.renderRemainingChars() : null}
        {toolbarPosition === 'bottom' ? this.renderToolbar() : null}

        <EditAttachments attachments={attachments} onDelete={this.deleteAttachment} />
      </div>
    );
  }
}