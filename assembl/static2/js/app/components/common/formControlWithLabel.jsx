// @flow
/* eslint-disable no-nested-ternary */
/*
  FormGroup that contains a FormControl for which:
    - if there is a value, displays a label
    - if there is no value, put the label in the placeholder
 */
import * as React from 'react';
import { ControlLabel, FormGroup, FormControl, HelpBlock } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
import { EditorState } from 'draft-js';

import RichTextEditor from './richTextEditor';
import { getValidationState } from '../administration/voteSession/voteProposalForm';
import Helper from './helper';

type FormControlWithLabelProps = {
  value: ?(string | EditorState),
  required: boolean,
  onChange: Function,
  type: string,
  disabled?: boolean,
  name?: string,
  label: string,
  labelAlwaysVisible: boolean,
  componentClass?: string,
  formControlProps?: Object,
  id?: string,
  validationErrors?: Array<ErrorDef>,
  helperUrl?: string,
  helperText: string,
  children?: React.Node,
  validationCallback?: (hasError: boolean) => void
};

type FormControlWithLabelState = {
  errorMessage?: string,
  validationErrors?: Array<ErrorDef>,
  validationState: ?string
};

class FormControlWithLabel extends React.Component<FormControlWithLabelProps, FormControlWithLabelState> {
  static defaultProps = {
    name: undefined,
    labelAlwaysVisible: false,
    type: 'text',
    value: undefined,
    required: false,
    validationErrors: undefined,
    helperUrl: '',
    componentClass: undefined,
    formControlProps: undefined,
    id: undefined,
    helperText: '',
    disabled: undefined,
    children: undefined
  };

  constructor(props: FormControlWithLabelProps) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  componentWillReceiveProps(nextProps: FormControlWithLabelProps) {
    if (nextProps.validationErrors !== this.props.validationErrors) {
      this.setState(this.getStateFromProps(nextProps));
    }
  }

  getStateFromProps = ({ validationErrors }: FormControlWithLabelProps) => {
    const validationState = getValidationState(validationErrors);
    // FIXME: for now, we only treat the first error
    const errorMessage =
      validationErrors && validationErrors.length > 0 ? I18n.t(validationErrors[0].code, validationErrors[0].vars) : '';
    return {
      errorMessage: errorMessage,
      validationState: validationState
    };
  };

  /* onBlur validation */
  setValidationState = () => {
    const { value, required, validationCallback } = this.props;
    let errorMessage = '';
    let validationState = null;
    let valueSize = 0;
    if (value) {
      if (typeof value === 'string') {
        valueSize = value.length;
      } else {
        valueSize = value.getCurrentContent().getPlainText().length;
      }
    }
    if (required && valueSize === 0) {
      errorMessage = I18n.t('error.required');
      validationState = 'error';
    }

    this.setState(
      { errorMessage: errorMessage, validationState: validationState },
      validationCallback ? validationCallback(validationState === 'error') : undefined
    );
  };

  getLabel = () => {
    const { label, required } = this.props;
    return required ? `${label}*` : label;
  };

  renderRichTextEditor = () => {
    const { onChange, value } = this.props;
    if (typeof value !== 'string') {
      const editorState = value || EditorState.createEmpty();
      return (
        <RichTextEditor
          editorState={editorState}
          placeholder={this.getLabel()}
          toolbarPosition="bottom"
          onChange={onChange}
          withAttachmentButton={false}
        />
      );
    }

    // don't render a RichTextEditor if value is a string
    return null;
  };

  renderFormControl = () => {
    const { required, type, value, disabled, componentClass, id, onChange, formControlProps, children } = this.props;
    if (type === 'rich-text') {
      return this.renderRichTextEditor();
    }
    const additionalProps = formControlProps || {};
    if (disabled) {
      additionalProps.disabled = disabled;
    } else if (disabled !== false) {
      delete additionalProps.disabled;
    }
    if (id) {
      additionalProps.id = id;
    }
    if (componentClass) {
      additionalProps.componentClass = componentClass;
    }

    const valueToShow = value || (value === 0 ? value : '');

    const name = this.props.name ? this.props.name : id;
    return (
      <FormControl
        required={required}
        name={name}
        type={type}
        placeholder={this.getLabel()}
        onChange={onChange}
        value={valueToShow}
        onBlur={this.setValidationState}
        {...additionalProps}
      >
        {children}
      </FormControl>
    );
  };

  renderHelper = () => {
    const { helperUrl, helperText } = this.props;
    return (
      <div className="inline">
        <Helper helperUrl={helperUrl} helperText={helperText} />
      </div>
    );
  };

  render() {
    const { id, labelAlwaysVisible, type, value, helperText } = this.props;
    const displayLabel = labelAlwaysVisible || (type !== 'rich-text' ? value || value === 0 : false);
    return (
      <FormGroup validationState={this.state.validationState}>
        {displayLabel ? <ControlLabel htmlFor={id}>{this.getLabel()}</ControlLabel> : null}
        {helperText ? this.renderHelper() : null}
        {this.renderFormControl()}
        {this.state.errorMessage ? <HelpBlock>{this.state.errorMessage}</HelpBlock> : null}
      </FormGroup>
    );
  }
}

export default FormControlWithLabel;