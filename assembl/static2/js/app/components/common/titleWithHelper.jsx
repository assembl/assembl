// @flow
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

type TitleWithHelperProps = {
  title: string,
  previewUrl: string,
  txt: string
};

const overflowMenu = (previewUrl, txt) => (
  <Popover id="admin-title-helper" className="helper-popover">
    <img src={previewUrl} width="300" height="auto" alt="admin-helper" />
    <div>{txt}</div>
  </Popover>
);

const TitleWithHelper = ({ title, previewUrl, txt }: TitleWithHelperProps) => (
  <div className="title">
    {title}
    <OverlayTrigger trigger={['hover', 'focus']} rootClose placement="right" overlay={overflowMenu(previewUrl, txt)}>
      <span className="assembl-icon-faq grey pointer" />
    </OverlayTrigger>
  </div>
);

export default TitleWithHelper;