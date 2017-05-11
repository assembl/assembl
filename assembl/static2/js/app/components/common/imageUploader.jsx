import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button, Image } from 'react-bootstrap';

class ImageUploader extends React.Component {
  constructor() {
    super();
    this.handleUploadButtonClick = this.handleUploadButtonClick.bind(this);
    this.state = {
      imageUrl: ''
    };
  }

  handleUploadButtonClick() {
    this.fileInput.click();
  }

  render() {
    const { file, handleChange } = this.props;
    if (file) {
      const reader = new FileReader();
      reader.onload = (function (theFile, c) {
        return function (e) {
          c.setState({
            imageUrl: e.target.result
          });
        };
      }(file, this));
      reader.readAsDataURL(file);
    }

    return (
      <div>
        {file
          ? <div>
            <span>{file.name}</span>
            <Image alt={file.name} src={this.state.imageUrl} thumbnail />
          </div>
          : null}

        <Button onClick={this.handleUploadButtonClick}>
          <Translate value="common.uploadButton" />
        </Button>
        <input
          style={{ display: 'none' }}
          type="file"
          accept="image/*"
          onChange={handleChange}
          ref={(c) => {
            return (this.fileInput = c);
          }}
        />
      </div>
    );
  }
}

export default ImageUploader;