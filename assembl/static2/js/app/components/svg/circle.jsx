import React from 'react';
import { calculatePercentage } from '../../utils/globalFunctions'

class Circle extends React.Component {
  render() {
    const { like, disagree } = this.props;
    const totalCount = like + disagree;
    const radius = 2.5;
    const circumference = 2 * radius * Math.PI;
    const green = (100 - calculatePercentage(like, totalCount)) / 100;
    const red = (100 - calculatePercentage(disagree, totalCount)) / 100;
    const redOffset = - circumference * red;
    const greenOffset = circumference * green;
    return (
      <svg
        className="gauge"
        height="10em"
        width="10em"
      >
        <circle
          className="circle radial-red"
          r={`${radius}em`}
          cx={`${5}em`}
          cy={`${5}em`}
          fill="transparent"
          strokeDasharray={`${circumference}em`}
          strokeDashoffset={`${redOffset}em`}
        />
        <circle
          className="circle radial-green"
          r={`${radius}em`}
          cx={`${5}em`}
          cy={`${5}em`}
          fill="transparent"
          strokeDasharray={`${circumference}em`}
          strokeDashoffset={`${greenOffset}em`}
        />
      </svg>
    );
  }
}

export default Circle;




