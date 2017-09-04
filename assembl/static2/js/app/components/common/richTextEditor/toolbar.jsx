// @flow
import React from 'react';
import { graphql } from 'react-apollo';
import { AtomicBlockUtils, DraftBlockType, DraftInlineStyle, RichUtils } from 'draft-js';
import { I18n } from 'react-redux-i18n';

import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import AttachFileForm from '../../common/attachFileForm';
import type { ButtonConfigType } from './buttonConfigType';
import ToolbarButton from './toolbarButton';

type ToolbarProps = {
  buttonsConfig: [ButtonConfigType],
  editorState: Function,
  focusEditor: Function,
  onChange: Function,
  uploadDocument: Function
};
type ToolbarState = {
  showAttachFileForm: boolean
};

class Toolbar extends React.Component<void, ToolbarProps, ToolbarState> {
  props: ToolbarProps;
  state: ToolbarState;
  currentStyle: DraftInlineStyle;
  currentBlockType: DraftBlockType;

  constructor() {
    super();
    this.state = {
      showAttachFileForm: false
    };
  }

  closeInsertionBox = (): void => {
    this.setState({
      showAttachFileForm: false
    });
  };

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
    switch (config.type) {
    case 'style': {
      isActive = this.currentStyle.contains(config.style);
      onToggle = () => {
        if (config.style) {
          return this.toggleInlineStyle(config.style);
        }

        return null;
      };
      break;
    }
    case 'block-type': {
      isActive = config.style === this.currentBlockType;
      onToggle = () => {
        return this.toggleBlockType(config.style);
      };
      break;
    }
    default:
      isActive = false;
      onToggle = () => {};
    }

    return <ToolbarButton key={`button-${config.id}`} {...config} isActive={isActive} onToggle={onToggle} />;
  };

  toggleAttachFileForm = () => {
    this.setState({
      showAttachFileForm: !this.state.showAttachFileForm
    });
  };

  addBlock = (data) => {
    const { editorState, onChange } = this.props;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('document', 'IMMUTABLE', data);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    // we need to use a non empty string for the third param of insertAtomicBlock method
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    onChange(newEditorState);
  };

  onAttachFileFormSubmit = (file) => {
    const variables = {
      file: file
    };
    this.props.uploadDocument({ variables: variables }).then((res) => {
      this.addBlock(res.data.uploadDocument.document);
      this.setState({
        showAttachFileForm: false
      });
    });
  };

  render() {
    const { buttonsConfig } = this.props;
    const { showAttachFileForm } = this.state;
    this.currentStyle = this.props.editorState.getCurrentInlineStyle();
    this.currentBlockType = this.getCurrentBlockType();
    return (
      <div className="editor-toolbar">
        <div className="btn-group">
          {buttonsConfig.map((buttonConfig) => {
            return this.renderButton(buttonConfig);
          })}
        </div>

        <div className="btn-group">
          <ToolbarButton
            key="button-attachment"
            id="attachment"
            icon="text-attachment"
            label={I18n.t('common.editor.attachment')}
            isActive={this.state.showAttachFileForm}
            onToggle={this.toggleAttachFileForm}
          />
        </div>

        {showAttachFileForm
          ? <div className="insertion-box box">
            <span className="assembl-icon-cancel" onClick={this.closeInsertionBox} />
            <AttachFileForm onSubmit={this.onAttachFileFormSubmit} />
          </div>
          : null}
      </div>
    );
  }
}

export default graphql(uploadDocumentMutation, { name: 'uploadDocument' })(Toolbar);