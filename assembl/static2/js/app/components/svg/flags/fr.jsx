import React from 'react';

class frFlag extends React.Component {
  render() {
    return (
      <svg
        width={`${20}px`}
        height={`${20}px`}
        x={`${0}px`}
        y={`${0}px`}
        viewBox="0 0 512 512"
        style={{ enableBackground: 'new 0 0 512 512' }}
      >
        <circle
          style={{ fill: '#F0F0F0' }}
          cx={256}
          cy={256}
          r={256}
        />
        <path
          style={{ fill: '#D80027' }}
          d="M512,256c0-110.071-69.472-203.906-166.957-240.077v480.155C442.528,459.906,512,366.071,512,256z"
        />
        <path
          style={{ fill: '#0052B4' }}
          d="M0,256c0,110.071,69.473,203.906,166.957,240.077V15.923C69.473,52.094,0,145.929,0,256z"
        />
      </svg>
    );
  }
}

export default frFlag;