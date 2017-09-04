// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type AttachFileFormProps = {
  onSubmit: Function
};

type AttachFileFormState = {
  file: Object | null
};

class AttachFileForm extends React.Component<*, AttachFileFormProps, AttachFileFormState> {
  props: AttachFileFormProps;
  state: AttachFileFormState;
  fileInput: HTMLInputElement;

  constructor() {
    super();
    this.state = {
      file: null
    };
  }

  handleSubmit = (): void => {
    const file = this.fileInput.files[0];
    this.props.onSubmit(file);
  };

  render() {
    return (
      <div className="attach-file">
        <label htmlFor="attachment">
          <Translate value="common.attachFileForm.label" />
        </label>
        <input
          name="attachment"
          type="file"
          ref={(p) => {
            return (this.fileInput = p);
          }}
        />
        <Button className="button-submit button-dark btn btn-default right" onClick={this.handleSubmit}>
          <Translate value="common.attachFileForm.submit" />
        </Button>
      </div>
    );
  }
}

export default AttachFileForm;