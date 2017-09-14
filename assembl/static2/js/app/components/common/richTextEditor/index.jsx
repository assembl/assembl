// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { convertFromRaw, convertToRaw, Editor, EditorState, RawContentState } from 'draft-js';

import classNames from 'classnames';
import punycode from 'punycode';

import AtomicBlockRenderer from './atomicBlockRenderer';
import Toolbar from './toolbar';
import type { ButtonConfigType } from './buttonConfigType';

type RichTextEditorProps = {
  rawContentState: RawContentState,
  handleInputFocus: Function,
  maxLength: number,
  placeholder: string,
  textareaRef: Function,
  toolbarPosition: string,
  updateContentState: Function,
  withAttachmentButton: boolean
};

type RichTextEditorState = {
  editorState: EditorState,
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

export default class RichTextEditor extends React.Component<Object, RichTextEditorProps, RichTextEditorState> {
  editor: HTMLDivElement;
  props: RichTextEditorProps;
  state: RichTextEditorState;
  static defaultProps: Object;

  static defaultProps = {
    handleInputFocus: null,
    maxLength: 0,
    toolbarPosition: 'top',
    withAttachmentButton: false
  };

  constructor(props: RichTextEditorProps): void {
    super(props);
    const editorState = props.rawContentState
      ? EditorState.createWithContent(convertFromRaw(props.rawContentState))
      : EditorState.createEmpty();
    this.state = {
      editorState: editorState,
      editorHasFocus: false
    };
  }

  componentDidMount() {
    this.editor.focus();
  }

  onBlur = () => {
    if (!this.props.preventOnBlur) {
      this.setState(
        {
          editorHasFocus: false
        },
        () => {
          const rawContentState = convertToRaw(this.state.editorState.getCurrentContent());
          this.props.updateContentState(rawContentState);
        }
      );
    }
  };

  onChange = (newEditorState: EditorState): void => {
    this.setState({
      editorState: newEditorState
    });
  };

  handleEditorFocus = (): Function => {
    const { handleInputFocus } = this.props;
    this.setState({
      editorHasFocus: true
    });

    return handleInputFocus;
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
    const decodeUnicode = (str) => {
      return punycode.ucs2.decode(str);
    }; // func to handle unicode characters
    const plainText = editorState.getCurrentContent().getPlainText('');
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, '').trim(); // replace above characters w/ nothing
    return decodeUnicode(cleanString).length;
  }

  shouldHidePlaceholder(): boolean {
    // don't display placeholder if user changes the block type (to bullet list) before to type anything
    const contentState = this.state.editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        return true;
      }
    }
    return false;
  }

  focusEditor = (): void => {
    // Hacky: Wait to focus the editor so we don't lose selection.
    // The toolbar actions don't work at all without this.
    setTimeout(() => {
      return this.editor.focus();
    }, 50);
  };

  renderRemainingChars = (): React.Element<*> => {
    const { maxLength } = this.props;
    const editorState = this.state.editorState;
    const charCount = this.getCharCount(editorState);
    const remainingChars = maxLength - charCount;
    return (
      <div className="annotation margin-xs">
        <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
      </div>
    );
  };

  renderToolbar = () => {
    return (
      <Toolbar
        buttonsConfig={this.getToolbarButtons()}
        editorState={this.state.editorState}
        focusEditor={this.focusEditor}
        onChange={this.onChange}
        withAttachmentButton={this.props.withAttachmentButton}
      />
    );
  };

  render() {
    const { maxLength, placeholder, textareaRef, toolbarPosition } = this.props;
    const { editorState } = this.state;
    const divClassName = classNames('rich-text-editor', { hidePlaceholder: this.shouldHidePlaceholder() });
    return (
      <div className={divClassName} ref={textareaRef}>
        {toolbarPosition === 'top' ? this.renderToolbar() : null}
        <div onClick={this.focusEditor}>
          <Editor
            blockRendererFn={customBlockRenderer}
            editorState={editorState}
            onBlur={this.onBlur}
            onChange={this.onChange}
            onFocus={this.handleEditorFocus}
            placeholder={placeholder}
            ref={(e) => {
              this.editor = e;
            }}
            spellCheck
          />
        </div>
        {maxLength ? this.renderRemainingChars() : null}
        {toolbarPosition === 'bottom' ? this.renderToolbar() : null}
      </div>
    );
  }
}