import React from 'react';
import { RichUtils } from 'draft-js';

import ToolbarButton from './toolbarButton';

class Toolbar extends React.Component {
  constructor() {
    super();
    this.renderButton = this.renderButton.bind(this);
  }

  getCurrentBlockType() {
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    return editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();
  }

  toggleBlockType(blockType) {
    const { editorState, focusEditor, onChange } = this.props;
    onChange(RichUtils.toggleBlockType(editorState, blockType));
    focusEditor();
  }

  toggleInlineStyle(style) {
    const { editorState, focusEditor, onChange } = this.props;
    onChange(RichUtils.toggleInlineStyle(editorState, style));
    focusEditor();
  }

  renderButton(config) {
    let isActive;
    let onToggle;
    if (config.type === 'style') {
      isActive = this.currentStyle.contains(config.style);
      onToggle = () => {
        return this.toggleInlineStyle(config.style);
      };
    } else {
      isActive = config.style === this.currentBlockType;
      onToggle = () => {
        return this.toggleBlockType(config.style);
      };
    }

    return <ToolbarButton key={`button-${config.id}`} {...config} isActive={isActive} onToggle={onToggle} />;
  }

  render() {
    const { buttonsConfig } = this.props;
    this.currentStyle = this.props.editorState.getCurrentInlineStyle();
    this.currentBlockType = this.getCurrentBlockType();
    return (
      <div className="editor-toolbar">
        {buttonsConfig.map((buttonConfig) => {
          return this.renderButton(buttonConfig);
        })}
      </div>
    );
  }
}

export default Toolbar;