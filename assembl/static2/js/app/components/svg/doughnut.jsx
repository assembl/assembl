import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';

import { calculatePercentage } from '../../utils/globalFunctions';

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

const getColor = (element) => {
  return 'color' in element ? element.color : 'grey';
};

const simpleCircle = (element) => {
  return <circle className="circle" cx="5em" cy="5em" r="2.5em" stroke={getColor(element)} />;
};

const placementFromAngle = (angle) => {
  const firstQuartant = 360 - 45;
  const secondQuartant = 45;
  const thirdQuartant = secondQuartant + 90;
  const fourthQuartant = thirdQuartant + 90;

  if ((angle >= firstQuartant && angle < 360) || (angle >= 0 && angle < secondQuartant)) return 'top';
  if (angle >= secondQuartant && angle < thirdQuartant) return 'right';
  if (angle >= thirdQuartant && angle < fourthQuartant) return 'bottom';
  if (angle >= fourthQuartant && angle < firstQuartant) return 'left';
  return 'right';
};

const circlePaths = (elements, totalCount) => {
  let nextStartAngle = 0;
  return elements.map((element, index) => {
    const normalizedSize = calculatePercentage(element.count, totalCount) / 100;
    const startAngle = nextStartAngle;
    const endAngle = startAngle + normalizedSize * 360;
    nextStartAngle = endAngle;
    const color = getColor(element);
    const middleAngle = startAngle + (endAngle - startAngle) / 2;
    return 'Tooltip' in element ? (
      <OverlayTrigger key={index} container={this} overlay={element.Tooltip} placement={placementFromAngle(middleAngle)}>
        <path d={describeArc(70, 70, 35, startAngle, endAngle)} stroke={color} fill="transparent" className={'circle'} />
      </OverlayTrigger>
    ) : (
      <path
        key={index}
        d={describeArc(70, 70, 35, startAngle, endAngle)}
        stroke={color}
        fill="transparent"
        className={'circle'}
      />
    );
  });
};

export default ({ elements, strokeWidth }) => {
  const filteredElements = elements.filter(({ count }) => {
    return count > 0;
  });
  const totalCount = filteredElements.reduce((total, element) => {
    return total + element.count;
  }, 0);
  return totalCount === 0 ? (
    false
  ) : (
    <svg className="doughnut" viewBox="0 0 140 140">
      {filteredElements.length === 1 ? (
        simpleCircle(filteredElements[0], strokeWidth)
      ) : (
        circlePaths(filteredElements, totalCount, strokeWidth)
      )}
    </svg>
  );
};