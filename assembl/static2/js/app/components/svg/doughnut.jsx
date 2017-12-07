import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';

import { calculatePercentage } from '../../utils/globalFunctions';

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');

  return d;
};

const getColor = element => ('color' in element ? element.color : 'lightgrey');

const simpleCircle = (cx, cy, r, element) =>
  ('Tooltip' in element ? (
    <OverlayTrigger overlay={element.Tooltip} placement="bottom">
      <circle className="circle" cx={cx} cy={cy} r={r} stroke={getColor(element)} />
    </OverlayTrigger>
  ) : (
    <circle className="circle" cx={cx} cy={cy} r={r} stroke={getColor(element)} />
  ));

const placementFromAngle = (angle) => {
  const topQuadrantStart = 360 - 45;
  const rightQuadrantStart = 45;
  const bottomQuadrantStart = rightQuadrantStart + 90;
  const leftQuadrantStart = bottomQuadrantStart + 90;

  if ((angle >= topQuadrantStart && angle < 360) || (angle >= 0 && angle < rightQuadrantStart)) return 'top';
  if (angle >= rightQuadrantStart && angle < bottomQuadrantStart) return 'right';
  if (angle >= bottomQuadrantStart && angle < leftQuadrantStart) return 'bottom';
  if (angle >= leftQuadrantStart && angle < topQuadrantStart) return 'left';
  return 'right';
};

const circlePaths = (cx, cy, r, elements, totalCount) => {
  let nextStartAngle = 0;
  return elements.map((element, index) => {
    const normalizedSize = calculatePercentage(element.count, totalCount) / 100;
    const startAngle = nextStartAngle;
    const endAngle = startAngle + normalizedSize * 360;
    nextStartAngle = endAngle;
    const color = getColor(element);
    const middleAngle = startAngle + (endAngle - startAngle) / 2;
    return 'Tooltip' in element ? (
      <OverlayTrigger key={index} overlay={element.Tooltip} placement={placementFromAngle(middleAngle)}>
        <path d={describeArc(cx, cy, r, startAngle, endAngle)} stroke={color} fill="transparent" className="circle" />
      </OverlayTrigger>
    ) : (
      <path key={index} d={describeArc(cx, cy, r, startAngle, endAngle)} stroke={color} fill="transparent" className="circle" />
    );
  });
};

const doughnutConstants = {
  cx: 70,
  cy: 70,
  r: 50
};

const Doughnut = ({ elements }) => {
  const filteredElements = elements.filter(({ count }) => count > 0);
  const totalCount = filteredElements.reduce((total, element) => total + element.count, 0);
  const { cx, cy, r } = doughnutConstants;
  const viewBox = `0 0 ${cx * 2} ${cy * 2}`;
  return totalCount === 0 ? (
    <svg className="doughnut" viewBox={viewBox}>
      {simpleCircle(cx, cy, r, { count: 0 })}
    </svg>
  ) : (
    <svg className="doughnut" viewBox={viewBox}>
      {filteredElements.length === 1
        ? simpleCircle(cx, cy, r, filteredElements[0])
        : circlePaths(cx, cy, r, filteredElements, totalCount)}
    </svg>
  );
};

export default Doughnut;