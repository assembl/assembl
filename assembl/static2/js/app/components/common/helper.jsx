// @flow
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

type HelperProps = {
  label?: string,
  helperUrl?: string,
  helperText: string,
  classname?: string,
  helperTextClassName?: string
};

const overflowMenu = (helperUrl, helperText, helperTextClassName) => (
  <Popover id="admin-title-helper" className="helper-popover">
    {helperUrl && <img src={helperUrl} width="300" height="auto" alt="admin-helper" />}
    <div className={helperTextClassName}>{helperText}</div>
  </Popover>
);

const Helper = ({ label, helperUrl, helperText, classname, helperTextClassName }: HelperProps) => (
  <div className={classname}>
    {label && label}
    &nbsp;
    <OverlayTrigger
      trigger={['hover', 'focus']}
      rootClose
      placement="right"
      overlay={overflowMenu(helperUrl, helperText, helperTextClassName)}
    >
      <span className="assembl-icon-faq grey pointer" />
    </OverlayTrigger>
  </div>
);

Helper.defaultProps = {
  label: '',
  helperUrl: '',
  classname: '',
  helperTextClassName: ''
};

export default Helper;