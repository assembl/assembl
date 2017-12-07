// @flow
import React from 'react';
import { graphql } from 'react-apollo';
import { AtomicBlockUtils, DraftBlockType, DraftInlineStyle, RichUtils } from 'draft-js';
import { I18n } from 'react-redux-i18n';

import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import AttachFileForm from '../../common/attachFileForm';
import { getBasename } from '../../../utils/globalFunctions';
import type { ButtonConfigType } from './buttonConfigType';
import ToolbarButton from './toolbarButton';

type ToolbarProps = {
  buttonsConfig: [ButtonConfigType],
  editorState: Function,
  focusEditor: Function,
  onChange: Function,
  uploadDocument: Function,
  withAttachmentButton: boolean
};

type ToolbarState = {
  attachedFiles: Array<File>,
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
      attachedFiles: [],
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
    return editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
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
      onToggle = () => this.toggleBlockType(config.style);
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

  addBlock = (file) => {
    // read the file, create entity and block in EditorState
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        const data = {
          externalUrl: reader.result,
          file: file,
          mimeType: file.type,
          title: getBasename(file.name)
        };
        const { editorState, onChange } = this.props;
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('document', 'IMMUTABLE', data);
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        // we need to use a non empty string for the third param of insertAtomicBlock method
        const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
        onChange(newEditorState);
      },
      false
    );
    reader.readAsDataURL(file);
  };

  onAttachFileFormSubmit = (file) => {
    this.setState(
      {
        attachedFiles: [...this.state.attachedFiles, file]
      },
      () => {
        if (file) {
          this.addBlock(file);
          this.setState({ showAttachFileForm: false });
        }
      }
    );
  };

  render() {
    const { buttonsConfig, withAttachmentButton } = this.props;
    const { showAttachFileForm } = this.state;
    this.currentStyle = this.props.editorState.getCurrentInlineStyle();
    this.currentBlockType = this.getCurrentBlockType();
    return (
      <div className="editor-toolbar">
        <div className="btn-group">{buttonsConfig.map(buttonConfig => this.renderButton(buttonConfig))}</div>

        {withAttachmentButton ? (
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
        ) : null}

        {showAttachFileForm ? (
          <div>
            <div className="modal-backdrop fade in" />
            <div className="insertion-box box">
              <span className="assembl-icon-cancel" onClick={this.closeInsertionBox} />
              <AttachFileForm onSubmit={this.onAttachFileFormSubmit} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default graphql(uploadDocumentMutation, { name: 'uploadDocument' })(Toolbar);