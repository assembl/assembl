// @flow
import * as React from 'react';

import { getIconPath } from '../../../utils/globalFunctions';

export type Props = {
  /** Optional value for label */
  value?: string,
  /** Optional classname for label style */
  classText?: string
};

const ToolbarSliderIcon = ({ value, classText }: Props) => (
  <div className="sliderIcon">
    <p className={classText}>{value}</p>
    <img alt="Slider thumb icon" src={getIconPath('icon-cursor-slider.svg')} />
  </div>
);

ToolbarSliderIcon.defaultProps = {
  value: '',
  classText: ''
};

export default ToolbarSliderIcon;