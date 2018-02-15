import React from 'react';

export default ({ rectCounts, color }) => {
  const greyRectCounts = 10 - rectCounts;
  const rectArray = [];
  for (let i = 1; i <= 10; i += 1) {
    if (i <= greyRectCounts) {
      rectArray.push('#dbd9d9');
    } else {
      rectArray.push(color);
    }
  }
  return (
    <svg width="25" height="58">
      {rectArray.map((hexa, index) => (
        <rect rx="1" height="3" width="15" y={(index + 1) * 5} x="5" strokeWidth="1.5" stroke={hexa} fill={hexa} key={index} />
      ))}
    </svg>
  );
};