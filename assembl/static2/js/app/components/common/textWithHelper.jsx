// @flow
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

type TextWithHelperProps = {
  text: string,
  helperUrl: string,
  helperText: string,
  classname: string
};

const overflowMenu = (helperUrl, helperText) => (
  <Popover id="admin-title-helper" className="helper-popover">
    <img src={helperUrl} width="300" height="auto" alt="admin-helper" />
    <div>{helperText}</div>
  </Popover>
);

const TextWithHelper = ({ text, helperUrl, helperText, classname }: TextWithHelperProps) => (
  <div className={classname}>
    {text}
    &nbsp;
    <OverlayTrigger trigger={['hover', 'focus']} rootClose placement="right" overlay={overflowMenu(helperUrl, helperText)}>
      <span className="assembl-icon-faq grey pointer" />
    </OverlayTrigger>
  </div>
);

export default TextWithHelper;