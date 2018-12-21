// @flow
import React from 'react';

type Props = {
  color: string
};

const Flag = ({ color }: Props) => (
  <svg width="20px" height="20px" viewBox="0 0 20 20">
    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g transform="translate(4.000000, 3.000000)">
        <g id="Capa_1">
          <polygon id="Shape" fill={color} points="12 9 0.5 9 0.5 1 12 1 9.5 5" />
          <path
            d="M0.25,
            0 C0.112,
            0 0,
            0.11175 0,
            0.25 L0,
            1 L0,
            14.75 C0,
            14.88825 0.112,
            15 0.25,
            15 C0.388,
            15 0.5,
            14.88825 0.5,
            14.75 L0.5,
            1 L0.5,
            0.25 C0.5,
            0.11175 0.388,
            0 0.25,
            0 L0.25,
            0 Z"
            id="Shape"
            stroke="#979797"
            fill="#9b9b9b"
          />
        </g>
      </g>
    </g>
  </svg>
);

export default Flag;