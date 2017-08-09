// @flow
import React from 'react';
import { DraftBlockType, DraftInlineStyle, RichUtils } from 'draft-js';

import ToolbarButton from './toolbarButton';

export type ButtonConfigType = {
  id: string,
  icon: string,
  label: string,
  type: 'block-type' | 'style',
  style: DraftBlockType | DraftInlineStyle
};

class Toolbar extends React.Component {
  currentStyle: DraftInlineStyle;
  currentBlockType: DraftBlockType;

  constructor() {
    super();
    this.renderButton = this.renderButton.bind(this);
  }

  getCurrentBlockType(): DraftBlockType {
    const { editorState } = this.props;
    const selection = editorState.getSelection();
    return editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();
  }

  toggleBlockType(blockType: DraftBlockType): void {
    const { editorState, focusEditor, onChange } = this.props;
    onChange(RichUtils.toggleBlockType(editorState, blockType));
    focusEditor();
  }

  toggleInlineStyle(style: string): void {
    const { editorState, focusEditor, onChange } = this.props;
    onChange(RichUtils.toggleInlineStyle(editorState, style));
    focusEditor();
  }

  renderButton = (config: ButtonConfigType): React.Element<*> => {
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
  };

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