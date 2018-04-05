// @flow
import React from 'react';

type Props = {
  backgroundColor: ?string,
  color: ?string
};

const DisplayTokens = ({ backgroundColor, color }: Props) => (
  <svg width="20px" height="20px" viewBox="0 0 20 20">
    <g id="icone-Activer-token" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="activer-token">
        <circle id="Oval-6" fill={backgroundColor} cx="10" cy="10" r="10" />
        <g id="Group-13" transform="translate(3.000000, 8.000000)" fill={color}>
          <circle id="Oval-3" cx="2" cy="2" r="2" />
          <circle id="Oval-3-Copy" cx="7" cy="2" r="2" />
          <circle id="Oval-3-Copy-2" cx="12" cy="2" r="2" />
        </g>
      </g>
    </g>
  </svg>
);

DisplayTokens.defaultProps = {
  color: '#5404d7',
  backgroundColor: '#f2f1fa'
};

export default DisplayTokens;