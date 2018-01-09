// @flow
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

type TitleWithHelperProps = {
  title: string,
  helperUrl: string,
  txt: string
};

const overflowMenu = (helperUrl, txt) => (
  <Popover id="admin-title-helper" className="helper-popover">
    <img src={helperUrl} width="300" height="auto" alt="admin-helper" />
    <div>{txt}</div>
  </Popover>
);

const TitleWithHelper = ({ title, helperUrl, txt }: TitleWithHelperProps) => (
  <div className="title">
    {title}
    &nbsp;
    <OverlayTrigger trigger={['hover', 'focus']} rootClose placement="right" overlay={overflowMenu(helperUrl, txt)}>
      <span className="assembl-icon-faq grey pointer" />
    </OverlayTrigger>
  </div>
);

export default TitleWithHelper;