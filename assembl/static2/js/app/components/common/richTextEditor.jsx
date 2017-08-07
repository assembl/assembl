import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Editor, RichUtils } from 'draft-js';
import punycode from 'punycode';

export default class RichTextEditor extends React.PureComponent {
  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
    this.onBoldClick = this.onBoldClick.bind(this);
    this.onItalicClick = this.onItalicClick.bind(this);
  }

  onChange(newEditorState) {
    const { updateEditorState } = this.props;
    updateEditorState(newEditorState);
  }

  onBoldClick() {
    const { editorState } = this.props;
    this.onChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
  }

  onItalicClick() {
    const { editorState } = this.props;
    this.onChange(RichUtils.toggleInlineStyle(editorState, 'ITALIC'));
  }

  getCharCount(editorState) {
    // this code is "borrowed" from the draft-js counter plugin
    const decodeUnicode = (str) => {
      return punycode.ucs2.decode(str);
    }; // func to handle unicode characters
    const plainText = editorState.getCurrentContent().getPlainText('');
    const regex = /(?:\r\n|\r|\n)/g; // new line, carriage return, line feed
    const cleanString = plainText.replace(regex, '').trim(); // replace above characters w/ nothing
    return decodeUnicode(cleanString).length;
  }

  render() {
    const { editorState, maxLength, placeholder } = this.props;
    const charCount = this.getCharCount(editorState);
    const remainingChars = maxLength - charCount;
    return (
      <div className="rich-text-editor">
        <div className="editor-toolbar">
          <Button onClick={this.onBoldClick}>
            <span className="assembl-icon-text-bold" />
          </Button>
          <Button onClick={this.onItalicClick}>
            <span className="assembl-icon-text-italics" />
          </Button>
        </div>
        <Editor editorState={editorState} onChange={this.onChange} placeholder={placeholder} />
        <div className="annotation margin-xs">
          <Translate value="debate.remaining_x_characters" nbCharacters={remainingChars < 10000 ? remainingChars : maxLength} />
        </div>
      </div>
    );
  }
}