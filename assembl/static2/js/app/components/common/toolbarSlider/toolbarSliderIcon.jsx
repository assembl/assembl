// @flow
import * as React from 'react';

// Helpers imports
import { getIconPath } from '../../../utils/globalFunctions';

export type Props = {
  /** Optional classname for label style */
  classText?: string,
  /** Optional value for label */
  value?: string
};

const ToolbarSliderIcon = ({ classText, value }: Props) => (
  <div className="sliderIcon">
    <p className={classText}>{value}</p>
    <img alt="Slider thumb icon" src={getIconPath('icon-cursor-slider.svg')} />
  </div>
);

ToolbarSliderIcon.defaultProps = {
  classText: '',
  value: ''
};

export default ToolbarSliderIcon;