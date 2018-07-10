import React from 'react';

class ThFlag extends React.Component {
  render() {
    return (
      <svg width="20px" height="20px" x="0px" y="0px" viewBox="0 0 512 512" style={{ enableBackground: 'new 0 0 512 512' }}>
        <circle style={{ fill: '#F0F0F0' }} cx="256" cy="256" r="256" />
        <path
          style={{ fill: '#0052B4' }}
          d="M496.077,166.957H15.923C5.632,194.69,0,224.686,0,256s5.632,61.31,15.923,89.043h480.155
             C506.368,317.31,512,287.314,512,256S506.368,194.69,496.077,166.957z"
        />
        <g>
          <path
            style={{ fill: '#D80027' }}
            d="M256,0C178.409,0,108.886,34.524,61.939,89.043H450.06C403.114,34.524,333.591,0,256,0z"
          />
          <path
            style={{ fill: '#D80027' }}
            d="M450.061,422.957H61.939C108.886,477.476,178.409,512,256,512S403.114,477.476,450.061,422.957z"
          />
        </g>
      </svg>
    );
  }
}

export default ThFlag;