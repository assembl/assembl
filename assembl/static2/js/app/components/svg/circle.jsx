// @flow
import React from 'react';

type Props = {
  fillColor: ?string,
  size: number,
  strokeColor: ?string
};

// need to stay a class for flow to understand defaultProps
class Circle extends React.Component<Props, Props, void> {
  static defaultProps = {
    fillColor: 'none',
    size: 28,
    strokeColor: '#000'
  };

  render() {
    const { fillColor, strokeColor, size } = this.props;
    return (
      <svg
        x="0"
        y="0"
        xmlSpace="preserve"
        aria-hidden="true"
        role="img"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        version="1.1"
      >
        <circle cx={size / 2} cy={size / 2} r={(size - 2) / 2} stroke={strokeColor} strokeWidth={2} fill={fillColor} />
      </svg>
    );
  }
}

export default Circle;