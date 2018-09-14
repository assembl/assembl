// @flow
import * as React from 'react';
import { Button, Col, Form as BootstrapForm, FormGroup } from 'react-bootstrap';
import { Form, Field } from 'react-final-form';
import { Translate } from 'react-redux-i18n';

import FileUploaderFieldAdapter from '../../../../js/app/components/form/fileUploaderFieldAdapter';

export type AddAttachmentFormValues = {
  externalUrl: string
};

type Props = {
  onSubmit: Function
};

type State = {
  file: File | null
};

class AddAttachmentForm extends React.Component<Props, State> {
  // fileInput: HTMLInputElement;

  // constructor() {
  //   super();
  //   this.state = {
  //     file: null
  //   };
  // }

  // handleSubmit = (): void => {
  //   this.props.onSubmit(this.state.file);
  // };

  // handleFileChange = (file: File): void => {
  //   this.setState({
  //     file: file
  //   });
  // };

  // render() {
  //   let isImage;
  //   const file = this.state.file;
  //   if (file !== null) {
  //     isImage = file.type.includes('image');
  //   }

  //   return (
  //     <div className={isImage ? 'attach-file with-preview' : 'attach-file'}>
  //       <div htmlFor="attachment" className="attachment-label">
  //         <Translate value="common.attachFileForm.label" />
  //       </div>

  //       <FileUploader handleChange={this.handleFileChange} fileOrUrl={this.state.file} withPreview />
  //       <Button className="button-submit button-dark btn btn-default" onClick={this.handleSubmit}>
  //         <Translate value="common.attachFileForm.submit" />
  //       </Button>
  //     </div>
  //   );
  // }
  render() {
    const { onSubmit } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={({ handleSubmit }) => (
          <BootstrapForm componentClass="div" horizontal>
            <Field name="file" component={FileUploaderFieldAdapter} />
            <FormGroup>
              <Col smOffset={2} sm={10}>
                <Button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }}
                >
                  <Translate value="common.editor.linkPlugin.submit" />
                </Button>
              </Col>
            </FormGroup>
          </BootstrapForm>
        )}
      />
    );
  }
}

export default AddAttachmentForm;