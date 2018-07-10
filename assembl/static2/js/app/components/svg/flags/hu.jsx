import React from 'react';

class HuFlag extends React.Component {
  render() {
    return (
      <svg width="20px" height="20px" x="0px" y="0px" viewBox="0 0 512 512" style={{ enableBackground: 'new 0 0 512 512' }}>
        <path
          style={{ fill: '#F0F0F0' }}
          d="M15.923,166.957C5.633,194.691,0,224.686,0,256s5.633,61.311,15.923,89.043L256,367.304
            l240.077-22.261C506.367,317.311,512,287.314,512,256s-5.633-61.309-15.923-89.043L256,144.696L15.923,166.957z"
        />
        <path
          style={{ fill: '#D80027' }}
          d="M256,0C145.93,0,52.094,69.472,15.924,166.957h480.155C459.906,69.472,366.072,0,256,0z"
        />
        <path
          style={{ fill: '#6DA544' }}
          d="M256,512c110.072,0,203.906-69.472,240.078-166.957H15.924C52.094,442.528,145.93,512,256,512z"
        />
      </svg>
    );
  }
}

export default HuFlag;