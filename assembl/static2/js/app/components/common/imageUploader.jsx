import React from 'react';

import { FormControl } from 'react-bootstrap';

const ImageUploader = ({ handleChange }) => {
  return <FormControl type="file" onChange={handleChange} />;
};

export default ImageUploader;