/* eslint-disable no-nested-ternary */
/*
  FormGroup that contains a FormControl for which:
    - if there is a value, displays a label
    - if there is no value, put the label in the placeholder
 */
import React from 'react';
import { ControlLabel, FormGroup, FormControl, HelpBlock } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

import RichTextEditor from './richTextEditor';
import { getValidationState } from '../administration/voteSession/voteProposalForm';

class FormControlWithLabel extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
    this.setValidationState = this.setValidationState.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.validationErrors !== this.props.validationErrors) {
      this.setState(this.getStateFromProps(nextProps));
    }
  }

  getStateFromProps = (props) => {
    const errors = props.validationErrors;
    const validationState = getValidationState(errors);
    // FIXME: for now, we only treat the first error
    const errorMessage = errors && errors.length > 0 ? I18n.t(errors[0].code, errors[0].vars) : '';
    return {
      errorMessage: errorMessage,
      validationState: validationState
    };
  };

  /* onBlur validation */
  setValidationState() {
    const { value, required } = this.props;
    let errorMessage = '';
    let validationState = null;
    const valueSize = value ? value.length : 0;
    if (required && valueSize === 0) {
      errorMessage = I18n.t('error.required');
      validationState = 'error';
    }

    this.setState({ errorMessage: errorMessage, validationState: validationState });
  }

  getLabel = () => {
    const { label, required } = this.props;
    const placeHolder = required ? `${label}*` : label;
    return placeHolder;
  };

  renderRichTextEditor = () => {
    const { onChange, value } = this.props;
    return (
      <RichTextEditor
        rawContentState={value}
        placeholder={this.getLabel()}
        toolbarPosition="bottom"
        updateContentState={cs => onChange(cs)}
        withAttachmentButton={false}
      />
    );
  };

  renderFormControl = () => {
    const { type, value, disabled, componentClass, id, onChange, formControlProps } = this.props;
    if (type === 'rich-text') {
      return this.renderRichTextEditor();
    }
    return (
      <FormControl
        componentClass={componentClass}
        id={id}
        type={type}
        placeholder={this.getLabel()}
        onChange={onChange}
        value={value || ''}
        onBlur={this.setValidationState}
        disabled={disabled}
        {...formControlProps}
      />
    );
  };

  render() {
    const { id, labelAlwaysVisible, type, value } = this.props;
    const displayLabel = labelAlwaysVisible || type !== 'rich-text' ? value : false;
    return (
      <FormGroup validationState={this.state.validationState}>
        {displayLabel ? <ControlLabel htmlFor={id}>{this.getLabel()}</ControlLabel> : null}
        {this.renderFormControl()}
        {this.state.errorMessage ? <HelpBlock>{this.state.errorMessage}</HelpBlock> : null}
      </FormGroup>
    );
  }
}

FormControlWithLabel.defaultProps = {
  labelAlwaysVisible: false,
  type: 'text',
  value: undefined,
  required: false
};

export default FormControlWithLabel;