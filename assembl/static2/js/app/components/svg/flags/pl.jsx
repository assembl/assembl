import React from 'react';

class PlFlag extends React.Component {
  render() {
    return (
      <svg width="20px" height="20px" x="0px" y="0px" viewBox="0 0 512 512" style={{ enableBackground: 'new 0 0 512 512' }}>
        <circle style={{ fill: '#F0F0F0' }} cx="256" cy="256" r="256" />
        <path style={{ fill: '#D80027' }} d="M512,256c0,141.384-114.616,256-256,256S0,397.384,0,256" />
      </svg>
    );
  }
}

export default PlFlag;