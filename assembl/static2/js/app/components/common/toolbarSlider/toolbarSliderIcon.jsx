// @flow
import * as React from 'react';

// Constant imports
import { ICO_SLIDER_CURSOR } from '../../../constants';

export type Props = {
  /** Optional classname for label style */
  textClassName?: string,
  /** Optional value for label */
  value?: string
};

const ToolbarSliderIcon = ({ textClassName, value }: Props) => (
  <div className="sliderIcon">
    <p className={textClassName}>{value}</p>
    <img alt="Slider thumb icon" src={ICO_SLIDER_CURSOR} />
  </div>
);

ToolbarSliderIcon.defaultProps = {
  textClassName: '',
  value: ''
};

export default ToolbarSliderIcon;