// @flow
import React from 'react';

class DisplayThread extends React.Component {
  props: { color: string, backgroundColor: string };

  static defaultProps = {
    color: '#5404d7',
    backgroundColor: '#f2f1fa'
  };

  render() {
    const { backgroundColor, color } = this.props;
    return (
      <svg width="20px" height="20px" viewBox="0 0 20 20">
        <g id="icone-Activer-thread" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g id="activer-thread">
            <circle id="Oval-6" fill={backgroundColor} cx="10" cy="10" r="10" />
            <rect id="Rectangle-16" fill={color} x="7" y="3" width="6" height="8" />
            <rect id="Rectangle-16-Copy" fill={color} x="9" y="12" width="4" height="5" />
          </g>
        </g>
      </svg>
    );
  }
}

export default DisplayThread;