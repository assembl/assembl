import React from 'react';
import { calculatePercentage } from '../../utils/globalFunctions';

export default ({ like, disagree }) => {
  const totalCount = like + disagree;
  const radius = 2.5;
  const circumference = 2 * radius * Math.PI;
  const elements = [{ name: 'green', count: like }, { name: 'red', count: disagree }];
  let lastSize = 0;
  return (
    <svg className="doughnut" height="10em" width="10em">
      {elements
        .filter(({ count }) => {
          return count > 0;
        })
        .map(({ name, count }, index) => {
          const normalizedSize = calculatePercentage(count, totalCount) / 100;
          const offset = lastSize;
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