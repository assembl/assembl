// @flow
import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import classnames from 'classnames';

type HelperProps = {
  label?: string,
  helperUrl?: string,
  helperText: string,
  classname?: string,
  additionalTextClasses?: string
};

const overflowMenu = (helperUrl, helperText, additionalTextClasses) => {
  const helperTextClasses = classnames([additionalTextClasses], 'helper-text');
  return (
    <Popover id="admin-title-helper" className="helper-popover">
      {helperUrl && <img src={helperUrl} width="300" height="auto" alt="admin-helper" />}
      <div className={helperTextClasses}>{helperText}</div>
    </Popover>
  );
};

const Helper = ({ label, helperUrl, helperText, classname, additionalTextClasses }: HelperProps) => (
  <div className={classname}>
    {label && label}
    &nbsp;
    <OverlayTrigger
      trigger={['hover', 'focus']}
      rootClose
      placement="right"
      overlay={overflowMenu(helperUrl, helperText, additionalTextClasses)}
    >
      <span className="assembl-icon-faq grey pointer" />
    </OverlayTrigger>
  </div>
);

Helper.defaultProps = {
  label: '',
  helperUrl: '',
  classname: '',
  additionalTextClasses: ''
};

export default Helper;