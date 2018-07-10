import React from 'react';

class DeFlag extends React.Component {
  render() {
    return (
      <svg width="20px" height="20px" x="0px" y="0px" viewBox="0 0 512 512" style={{ enableBackground: 'new 0 0 512 512' }}>
        <path
          style={{ fill: '#FFDA44' }}
          d="M15.923,345.043C52.094,442.527,145.929,512,256,512s203.906-69.473,240.077-166.957L256,
          322.783L15.923,345.043z"
        />
        <path d="M256,0C145.929,0,52.094,69.472,15.923,166.957L256,189.217l240.077-22.261C459.906,69.472,366.071,0,256,0z" />
        <path
          style={{ fill: '#D80027' }}
          d="M15.923,166.957C5.633,194.69,0,224.686,0,256s5.633,61.31,15.923,
          89.043h480.155C506.368,317.31,512,287.314,512,256s-5.632-61.31-15.923-89.043H15.923z"
        />
      </svg>
    );
  }
}

export default DeFlag;