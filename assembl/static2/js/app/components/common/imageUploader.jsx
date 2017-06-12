import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

class ImageUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imgName: '',
      imgSrc: undefined
    };
    this.handleChangePreview = this.handleChangePreview.bind(this);
    this.handleUploadButtonClick = this.handleUploadButtonClick.bind(this);
    this.updateImageInfo = this.updateImageInfo.bind(this);
  }

  componentDidMount() {
    this.updateImageInfo(this.props.imgUrl);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.imgUrl !== nextProps.imgUrl) {
      this.updateImageInfo(nextProps.imgUrl);
    }
  }

  handleUploadButtonClick() {
    this.fileInput.click();
  }

  handleChangePreview() {
    const file = this.fileInput.files[0];
    this.setState({
      imgName: file.name || ''
    });
    this.props.handleImageChange(file);
  }

  updateImageInfo(imgUrl) {
    // warning: here imgUrl can be an url or a File object
    // update image src and name if imgUrl is a File
    if (Object.getPrototypeOf(imgUrl) === File.prototype) {
      const file = imgUrl;
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => {
          this.setState({
            imgName: file.name || '',
            imgSrc: reader.result
          });
        },
        false
      );
      if (file) {
        reader.readAsDataURL(imgUrl);
      }
    } else {
      this.setState({ imgSrc: imgUrl });
    }
  }

  render() {
    return (
      <div>
        <Button onClick={this.handleUploadButtonClick}>
          <Translate value="common.uploadButton" />
        </Button>
        <div className={this.state.imgSrc ? 'preview' : 'hidden'}>
          <img
            src={this.state.imgSrc}
            ref={(p) => {
              return (this.preview = p);
            }}
            alt="preview"
          />
        </div>
        <div className="preview-title">{this.state.imgName}</div>
        <input
          type="file"
          onChange={this.handleChangePreview}
          className="hidden"
          ref={(p) => {
            return (this.fileInput = p);
          }}
        />
      </div>
    );
  }
}

export default ImageUploader;