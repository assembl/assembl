// @flow

const defaultGenerator = (name: string, index: number): string => {
  let className = name;
  if (index % 4 === 0) {
    className += ' clear';
  }
  if (index <= 3) {
    className += ` ${name}-first-row-${index % 4}`;
  } else {
    className += ` ${name}-${index % 4}`;
  }
  return className;
};

export const CLASS_NAME_GENERATOR = {
  default: defaultGenerator
};