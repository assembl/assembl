// @flow
import React from 'react';

type Props = {
  backgroundColor: ?string,
  color: ?string
};

const DisplayOpenQuestions = ({ backgroundColor, color }: Props) => (
  <svg width="20px" height="20px" viewBox="0 0 20 20">
    <g id="icone-Activer-Questions" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g id="activer-Q°">
        <circle id="Oval-6" fill={backgroundColor} cx="10" cy="10" r="10" />
        <g
          id="Group-14"
          transform="translate(11.525126, 10.495689) rotate(45.000000) translate(-11.525126, -10.495689) translate(7.525126, 6.495689)" //eslint-disable-line
          fill={color}
          stroke={color}
          strokeLinejoin="round"
        >
          <rect id="Rectangle-19" x="0.707106781" y="0.292893219" width="1" height="6.8137085" />
          <rect
            id="Rectangle-19-Copy"
            transform="translate(4.113961, 6.849523) rotate(90.000000) translate(-4.113961, -6.849523) "
            x="3.61396103"
            y="3.44266875"
            width="1"
            height="6.8137085"
          />
        </g>
      </g>
    </g>
  </svg>
);

DisplayOpenQuestions.defaultProps = {
  color: '#5404d7',
  backgroundColor: '#f2f1fa'
};

export default DisplayOpenQuestions;