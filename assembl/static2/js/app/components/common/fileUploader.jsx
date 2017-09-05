import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

class FileUploader extends React.Component {
  static defaultProps = {
    withPreview: true
  };

  constructor(props) {
    super(props);
    this.state = {
      filename: '',
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
      filename: file.name || ''
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
            filename: file.name || '',
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