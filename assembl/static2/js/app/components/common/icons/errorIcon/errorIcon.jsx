// @flow
import React from 'react';
import './errorIcon.scss';

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="126" height="126" viewBox="0 0 126 126" className="icon error">
    <g fill="none" fillRule="evenodd">
      <g className="arrow1">
        <path strokeWidth="5.4" d="M117.052 38.72C107.787 17.665 87.042 3 62.938 3c-32.74 0-59.28 27.052-59.28 60.422" />
        <path strokeLinejoin="round" strokeWidth="6" d="M122.334 18.285l-3.32 20.692-18.506-5.075" />
      </g>
      <g className="arrow2">
        <path strokeWidth="5.4" d="M8.948 87.28C18.213 108.335 38.958 123 63.062 123c32.74 0 59.28-27.052 59.28-60.422" />
        <path strokeLinejoin="round" strokeWidth="6" d="M3.666 107.715l3.32-20.692 18.506 5.075" />
      </g>
      <text className="mark">
        <tspan x="46.239" y="84.175">
          !
        </tspan>
      </text>
    </g>
  </svg>
);

export default ErrorIcon;