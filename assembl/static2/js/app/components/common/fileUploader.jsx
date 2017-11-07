// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

type FileUploaderProps = {
  fileOrUrl: File | string,
  mimeType: string,
  name: string,
  handleChange: Function,
  withPreview: boolean
};

type FileUploaderState = {
  fileName: string,
  fileSrc?: string | ArrayBuffer
};

/*
  File uploader

  when this component receives an url and that we want to render the preview of this image,
  we need to give it a mimeType prop that starts with 'image/'
*/
class FileUploader extends React.Component<Object, FileUploaderProps, FileUploaderState> {
  props: FileUploaderProps;
  state: FileUploaderState;
  fileInput: HTMLInputElement;
  preview: HTMLImageElement;

  static defaultProps = {
    mimeType: '',
    name: 'file-uploader',
    withPreview: true
  };

  constructor(props: FileUploaderProps) {
    super(props);
    this.state = {
      fileName: '',
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
      fileName: file.name || ''
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
            fileName: file.name || '',
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
    const { mimeType, name, withPreview } = this.props;
    const fileSrc = this.state.fileSrc;
    const fileIsImage = fileSrc && fileSrc instanceof String && fileSrc.startsWith('data:image/');
    const mimeTypeIsImage = mimeType.startsWith('image/');
    const isImage = fileIsImage || mimeTypeIsImage;
    return (
      <div>
        <Button onClick={this.handleUploadButtonClick}>
          <Translate value="common.uploadButton" />
        </Button>
        {withPreview && isImage
          ? <div className={fileSrc ? 'preview' : 'hidden'}>
            <img
              src={fileSrc}
              ref={(p) => {
                this.preview = p;
              }}
              alt="preview"
            />
          </div>
          : null}
        {!isImage &&
          <div className="preview-title">
            {this.state.fileName}
          </div>}
        <input
          name={name}
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