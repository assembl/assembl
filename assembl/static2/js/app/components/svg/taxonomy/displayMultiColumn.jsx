// @flow
import React from 'react';

type Props = {
  backgroundColor: ?string,
  color: ?string
};

const DisplayMultiColumn = ({ backgroundColor, color }: Props) => (
  <svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1">
    <g id="icone-Activer-multi-colonne" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="2-col">
        <circle id="Oval-6" fill={backgroundColor} cx="10" cy="10" r="10" />
        <g id="Group-12" transform="translate(6.000000, 4.000000)" fill={color}>
          <rect id="Rectangle-9" x="0" y="0" width="3" height="12" />
          <rect id="Rectangle-9-Copy" x="5" y="0" width="3" height="12" />
        </g>
      </g>
    </g>
  </svg>
);

DisplayMultiColumn.defaultProps = {
  color: '#5404d7',
  backgroundColor: '#f2f1fa'
};

export default DisplayMultiColumn;