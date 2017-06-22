/*
  FormGroup that contains a FormControl for which:
    - if there is a value, displays a label
    - if there is no value, put the label in the placeholder
 */
import React from 'react';
import { ControlLabel, FormGroup, FormControl, HelpBlock } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

class FormControlWithLabel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: '',
      validationState: null
    };
    this.setValidationState = this.setValidationState.bind(this);
  }

  setValidationState() {
    let errorMessage = '';
    let validationState = null;
    if (this.props.required && this.props.value.length === 0) {
      errorMessage = I18n.t('error.required');
      validationState = 'error';
    }

    this.setState({ errorMessage: errorMessage, validationState: validationState });
  }

  render() {
    const { componentClass, id, label, onChange, type, value } = this.props;
    return (
      <FormGroup validationState={this.state.validationState}>
        {value ? <ControlLabel htmlFor={id}>{label}</ControlLabel> : null}
        <FormControl componentClass={componentClass} id={id} type={type} placeholder={label} onChange={onChange} value={value} onBlur={this.setValidationState} />
        {this.state.errorMessage ? <HelpBlock>{this.state.errorMessage}</HelpBlock> : null}
      </FormGroup>
    );
  }
}

FormControlWithLabel.defaultProps = {
  type: 'text',
  value: ''
};

export default FormControlWithLabel;