import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

/*
  File uploader

  when this component receives an url and that we want to render the preview of this image,
  we need to give it a mimeType prop that starts with 'image/'
*/
class FileUploader extends React.Component {
  static defaultProps = {
    mimeType: '',
    name: 'file-uploader',
    withPreview: true
  };

  constructor(props) {
    super(props);
    this.state = {
      fileName: '',
      fileSrc: undefined
    };
    this.handleChangePreview = this.handleChangePreview.bind(this);
    this.handleUploadButtonClick = this.handleUploadButtonClick.bind(this);
    this.updateInfo = this.updateInfo.bind(this);
  }

  componentDidMount() {
    this.updateInfo(this.props.fileOrUrl);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.fileOrUrl !== nextProps.fileOrUrl) {
      this.updateInfo(nextProps.fileOrUrl);
    }
  }

  handleUploadButtonClick() {
    this.fileInput.click();
  }

  handleChangePreview() {
    const file = this.fileInput.files[0];
    this.setState({
      fileName: file.name || ''
    });
    this.props.handleChange(file);
  }

  updateInfo(fileOrUrl) {
    // warning: here fileOrUrl can be an url or a File object
    // update file src and name if fileOrUrl is a File
    if (fileOrUrl && Object.getPrototypeOf(fileOrUrl) === File.prototype) {
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
    } else {
      this.setState({ fileSrc: fileOrUrl });
    }
  }

  render() {
    const { mimeType, name, withPreview } = this.props;
    const fileSrc = this.state.fileSrc;
    const fileIsImage = fileSrc && fileSrc.startsWith('data:image/');
    const mimeTypeIsImage = mimeType && mimeType.startsWith('image/');
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