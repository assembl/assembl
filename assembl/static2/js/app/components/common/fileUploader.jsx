// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

type FileUploaderProps = {
  fileOrUrl: File | string,
  handleChange: Function
};

type FileUploaderState = {
  filename: string,
  fileSrc?: string | ArrayBuffer
};

class FileUploader extends React.Component<Object, FileUploaderProps, FileUploaderState> {
  props: FileUploaderProps;
  state: FileUploaderState;
  fileInput: HTMLInputElement;
  preview: HTMLImageElement;

  static defaultProps = {
    withPreview: true
  };

  constructor(props: FileUploaderProps) {
    super(props);
    this.state = {
      filename: '',
      fileSrc: undefined
    };
  }

  componentDidMount() {
    this.updateInfo(this.props.fileOrUrl);
  }

  componentWillReceiveProps(nextProps: FileUploaderProps) {
    if (this.props.fileOrUrl !== nextProps.fileOrUrl) {
      this.updateInfo(nextProps.fileOrUrl);
    }
  }

  handleUploadButtonClick = () => {
    this.fileInput.click();
  };

  handleChangePreview = () => {
    const file = this.fileInput.files[0];
    this.setState({
      filename: file.name || ''
    });
    this.props.handleChange(file);
  };

  updateInfo = (fileOrUrl: File | string) => {
    // warning: here fileOrUrl can be an url or a File object
    // update file src and name if fileOrUrl is a File
    if (fileOrUrl && fileOrUrl instanceof File) {
      const file = fileOrUrl;
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => {
          this.setState({
            filename: file.name || '',
            fileSrc: reader.result
          });
        },
        false
      );
      if (file) {
        reader.readAsDataURL(fileOrUrl);
      }
    } else if (typeof fileOrUrl === 'string') {
      this.setState({ fileSrc: fileOrUrl });
    }
  };

  render() {
    return (
      <div>
        <Button onClick={this.handleUploadButtonClick}>
          <Translate value="common.uploadButton" />
        </Button>
        {this.props.withPreview
          ? <div className={this.state.fileSrc ? 'preview' : 'hidden'}>
            <img
              src={this.state.fileSrc}
              ref={(p) => {
                this.preview = p;
              }}
              alt="preview"
            />
          </div>
          : null}
        <div className="preview-title">
          {this.state.filename}
        </div>
        <input
          type="file"
          onChange={this.handleChangePreview}
          className="hidden"
          ref={(p) => {
            this.fileInput = p;
          }}
        />
      </div>
    );
  }
}

export default FileUploader;