// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import ImageUploader from './imageUploader';

type AttachFileFormProps = {
  onSubmit: Function
};

type AttachFileFormState = {
  file: File | null
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
    this.props.onSubmit(this.state.file);
  };

  handleImageChange = (file: File): void => {
    this.setState({
      file: file
    });
  };

  render() {
    return (
      <div className="attach-file">
        <label htmlFor="attachment">
          <Translate value="common.attachFileForm.label" />
        </label>
        <ImageUploader handleImageChange={this.handleImageChange} imgUrl={this.state.file} withPreview={false} />
        <Button className="button-submit button-dark btn btn-default right" onClick={this.handleSubmit}>
          <Translate value="common.attachFileForm.submit" />
        </Button>
      </div>
    );
  }
}

export default AttachFileForm;