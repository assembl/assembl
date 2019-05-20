// @flow
import * as React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import classnames from 'classnames';

import { isMobile } from '../../utils/globalFunctions';
import { MEDIUM_SCREEN_WIDTH } from '../../constants';
import { withScreenWidth } from '../common/screenDimensions';

type HelperProps = {
  label?: string,
  helperUrl?: string,
  helperText: string,
  classname?: string,
  additionalTextClasses?: string,
  popOverClass?: string,
  screenWidth: number
};

const overflowMenu = (helperUrl, helperText, additionalTextClasses, popOverClass) => {
  const helperTextClasses = classnames([additionalTextClasses], 'helper-text');
  return (
    <Popover id="admin-title-helper" className={popOverClass || 'helper-popover'}>
      {helperUrl && <img src={helperUrl} width="300" height="auto" alt="admin-helper" />}
      <div className={helperTextClasses}>{helperText}</div>
    </Popover>
  );
};

const Helper = ({ label, helperUrl, helperText, classname, additionalTextClasses, popOverClass, screenWidth }: HelperProps) => (
  <div className={classname}>
    {label && label}
    &nbsp;
    <OverlayTrigger
      trigger={['hover', 'focus', 'click']}
      rootClose
      placement={isMobile.any() || screenWidth <= MEDIUM_SCREEN_WIDTH ? 'bottom' : 'right'}
      overlay={overflowMenu(helperUrl, helperText, additionalTextClasses, popOverClass)}
    >
      <span className="assembl-icon-faq grey pointer" />
    </OverlayTrigger>
  </div>
);

Helper.defaultProps = {
  label: '',
  helperUrl: '',
  classname: '',
  additionalTextClasses: '',
  popOverClass: ''
};

export default withScreenWidth(Helper);