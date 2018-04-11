// @flow
import React from 'react';

type Props = {
  backgroundColor: ?string,
  color: ?string
};

const Example = ({ backgroundColor, color }: Props) => (
  <svg width="20px" height="20px" viewBox="0 0 20 20">
    <g id="icone-Donner-exemples" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="Donner-exemples">
        <circle id="Oval-6" fill={backgroundColor} cx="10" cy="10" r="10" />
        <g id="Group-11" transform="translate(2.000000, 9.000000)" fill={color}>
          <rect id="Rectangle-18" x="0" y="0" width="4" height="2" />
          <rect id="Rectangle-18-Copy" x="6" y="0" width="4" height="2" />
          <rect id="Rectangle-18-Copy-2" x="12" y="0" width="4" height="2" />
        </g>
      </g>
    </g>
  </svg>
);

Example.defaultProps = {
  color: '#5404d7',
  backgroundColor: '#f2f1fa'
};

export default Example;