// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { EditorState, RichUtils } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import classNames from 'classnames';
import createToolbarPlugin from 'draft-js-static-toolbar-plugin';
import { ItalicButton, BoldButton, UnorderedListButton } from 'draft-js-buttons';
import createCounterPlugin from 'draft-js-counter-plugin';

import AtomicBlockRenderer from './atomicBlockRenderer';
import EditAttachments from '../editAttachments';
import attachmentsPlugin from './attachmentsPlugin';

type DraftPlugin = any;

type Props = {
  editorState: EditorState,
  handleInputFocus?: Function,
  maxLength: number,
  onChange: Function,
  placeholder?: string,
  textareaRef?: Function,
  toolbarPosition: string
  // withAttachmentButton: boolean
};

type State = {
  editorHasFocus: boolean
};

const RemainingCharsCounter = ({ count }) => (
  <div className="annotation margin-xs">
    <Translate value="debate.remaining_x_characters" nbCharacters={count} />
  </div>
);

function customBlockRenderer(block) {
  if (block.getType() === 'atomic') {
    return {
      component: AtomicBlockRenderer,
      editable: false
    };
  }

  return null;
}

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
    const counterPlugin = createCounterPlugin();
    const staticToolbarPlugin = createToolbarPlugin({
      structure: [BoldButton, ItalicButton, UnorderedListButton, ToolbarSeparator],
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

    this.plugins = [counterPlugin, staticToolbarPlugin];

    const { CustomCounter } = counterPlugin;
    const { Toolbar } = staticToolbarPlugin;
    this.components = {
      CustomCounter: CustomCounter,
      Toolbar: Toolbar
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

  countRemainingChars = (plainText: string): number => {
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, '').trim(); // replace above characters w/ nothing
    return this.props.maxLength - cleanString.length;
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

  render() {
    const { editorState, maxLength, onChange, placeholder, textareaRef, toolbarPosition } = this.props;
    const divClassName = classNames('rich-text-editor', { hidePlaceholder: this.shouldHidePlaceholder() });
    const attachments = attachmentsPlugin.getAttachments(editorState);
    const { CustomCounter, Toolbar } = this.components;
    return (
      <div className={divClassName} ref={textareaRef}>
        <div className="editor-header">
          {editorState.getCurrentContent().hasText() ? <div className="editor-label form-label">{placeholder}</div> : null}
          {toolbarPosition === 'top' ? <Toolbar /> : null}
          <div className="clear" />
        </div>
        <div>
          <Editor
            blockRendererFn={customBlockRenderer}
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
          <CustomCounter component={RemainingCharsCounter} limit={maxLength} countFunction={this.countRemainingChars} />
        ) : null}
        {toolbarPosition === 'bottom' ? <Toolbar /> : null}

        <EditAttachments attachments={attachments} onDelete={this.deleteAttachment} />
      </div>
    );
  }
}