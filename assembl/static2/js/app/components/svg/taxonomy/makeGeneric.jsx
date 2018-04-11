// @flow
import React from 'react';

type Props = {
  backgroundColor: ?string,
  color: ?string
};

const MakeGeneric = ({ backgroundColor, color }: Props) => (
  <svg width="20px" height="20px" viewBox="0 0 20 20">
    <g id="icone-rendre-plus-générique" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="Générique">
        <circle id="Oval-6" fill={backgroundColor} cx="10" cy="10" r="10" />
        <g
          id="right-arrow-(4)"
          transform="translate(10.000000, 10.000000) rotate(-90.000000) translate(-10.000000, -10.000000) translate(5.000000, 7.000000)" // eslint-disable-line
          fill={color}
          fillRule="nonzero"
          stroke={color}
          strokeWidth="0.5"
        >
          <path
            d="M6.73388377,0.0902357511 C6.59765005,-0.0300785837 6.3709114,-0.0300785837 6.22991426,0.0902357511 C6.09368053,0.206485412 6.09368053,0.39996387 6.22991426,0.515942553 L8.78532868,2.69650438 L0.352810416,2.69650438 C0.156240076,2.69677536 0,2.83009665 0,2.99783217 C0,3.1655677 0.156240076,3.30322464 0.352810416,3.30322464 L8.78532868,3.30322464 L6.22991426,5.4797218 C6.09368053,5.60003613 6.09368053,5.79378557 6.22991426,5.90976425 C6.3709114,6.03007858 6.59796761,6.03007858 6.73388377,5.90976425 L9.89425214,3.21298889 C10.0352493,3.09673923 10.0352493,2.90326077 9.89425214,2.78728209 L6.73388377,0.0902357511 Z" // eslint-disable-line
            id="Shape"
          />
        </g>
      </g>
    </g>
  </svg>
);

MakeGeneric.defaultProps = {
  color: '#5404d7',
  backgroundColor: '#f2f1fa'
};

export default MakeGeneric;