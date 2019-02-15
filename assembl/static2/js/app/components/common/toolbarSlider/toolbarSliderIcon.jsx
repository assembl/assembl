// @flow
import * as React from 'react';

// Helpers imports
import { getIconPath } from '../../../utils/globalFunctions';

export type Props = {
  /** Optional classname for label style */
  textClassName?: string,
  /** Optional value for label */
  value?: string
};

const ToolbarSliderIcon = ({ textClassName, value }: Props) => (
  <div className="sliderIcon">
    <p className={textClassName}>{value}</p>
    <img alt="Slider thumb icon" src={getIconPath('icon-cursor-slider.svg')} />
  </div>
);

ToolbarSliderIcon.defaultProps = {
  textClassName: '',
  value: ''
};

export default ToolbarSliderIcon;