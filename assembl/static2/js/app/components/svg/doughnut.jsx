import React from 'react';
import { calculatePercentage } from '../../utils/globalFunctions';

export default ({ elements }) => {
  const totalCount = elements.reduce((total, element) => {
    return total + element.count;
  }, 0);
  const radius = 2.5;
  const circumference = 2 * radius * Math.PI;
  let lastSize = 0;
  return (
    <svg className="doughnut" height="10em" width="10em">
      {elements
        .filter(({ count }) => {
          return count > 0;
        })
        .map(({ name, count }, index) => {
          const normalizedSize = calculatePercentage(count, totalCount) / 100;
          const offset = circumference - lastSize;
          const size = circumference * normalizedSize;
          lastSize = size;
          const gap = circumference - size;
          return (
            <circle
              key={index}
              className={`circle radial-${name}`}
              r={`${radius}em`}
              cx={`${5}em`}
              cy={`${5}em`}
              strokeDasharray={`${size}em ${gap}em`}
              strokeDashoffset={`${offset}em`}
            />
          );
        })}
    </svg>
  );
};