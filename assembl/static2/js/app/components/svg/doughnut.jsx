import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { calculatePercentage } from '../../utils/globalFunctions';

const createTooltip = (text) => {
  return (
    <Tooltip id="tooltip">
      {text}
    </Tooltip>
  );
};

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');

  return d;
};

export default ({ elements, text }) => {
  const totalCount = elements.reduce((total, element) => {
    return total + element.count;
  }, 0);
  const radius = 2.5;
  const circumference = 2 * radius * Math.PI;
  const baseOffset = 0;
  let nextStartAngle = 0;
  return (
    <div>
      <svg className="doughnut" height="10em" width="10em">
        {elements
          .filter(({ count }) => {
            return count > 0;
          })
          .map(({ name, count }, index) => {
            const normalizedSize = calculatePercentage(count, totalCount) / 100;
            // const offset = circumference * nextOffset;
            const startAngle = nextStartAngle;
            const endAngle = startAngle + normalizedSize * 360;
            nextStartAngle = endAngle;
            // const size = circumference * normalizedSize;
            // const gap = circumference - size;
            return (
              <OverlayTrigger key={index} container={this} placement="right" overlay={createTooltip(`${count} ${name}`)}>
                {/* <circle
                  className={`circle radial-${name}`}
                  r={`${radius}em`}
                  cx={`${5}em`}
                  cy={`${5}em`}
                  strokeDasharray={`${0}em ${offset}em ${size}em ${gap}em`}
                />*/}
                <path d={describeArc(70, 70, 60, startAngle, endAngle)} stroke={name} fill="transparent" strokeWidth="10" />
              </OverlayTrigger>
            );
          })}
        {text &&
          <text x="50%" y="50%" textAnchor="middle">
            {text}
          </text>}
      </svg>
    </div>
  );
};