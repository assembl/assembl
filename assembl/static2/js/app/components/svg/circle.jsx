// @flow
import React from 'react';

type Props = {
  fillColor?: ?string,
  size?: string,
  strokeColor?: ?string
};

const Circle = ({ fillColor, strokeColor, size }: Props) => (
  <svg
    x="0px"
    y="0px"
    xmlSpace="preserve"
    aria-hidden="true"
    role="img"
    width={size}
    height={size}
    viewBox="0 0 22 22"
    version="1.1"
  >
    <path
      className="outer"
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth="1"
      strokeMiterlimit="4"
      strokeOpacity="1"
      strokeDasharray="none"
      id="path2999"
      d="m 15.59322,11.271187 a 6.2288136,6.3559322 0 1 1 -12.4576271,0 6.2288136,6.3559322 0 1 1 12.4576271,0 z"
      transform="matrix(1.4872568,0,0,1.4575117,-3.9272774,-6.4278868)"
    />
  </svg>
);

Circle.defaultProps = {
  fillColor: 'none',
  size: '30px',
  strokeColor: '#000'
};

export default Circle;