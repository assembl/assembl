// @flow
import * as React from 'react';
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';

type ImageProps = {
  className: String,
  src: String,
  alt: String,
  title: String
};

const modalImage = ({ className, src, alt, title }: ImageProps) => {
  const handleClick = () => {
    const content = (
      <div>
        <div className="modal-image-close-button" onClick={closeModal}>
          <span className="assembl-icon-cancel grey" />
        </div>
        <img alt={alt} src={src} title={title} />
      </div>
    );
    return displayCustomModal(content, true, 'modal-image');
  };
  return (
    <div onClick={handleClick}>
      <img alt={alt} className={className} src={src} title={title} />
    </div>
  );
};

export default modalImage;