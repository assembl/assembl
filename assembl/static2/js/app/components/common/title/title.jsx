// @flow
import * as React from 'react';

export type Props = {
  /** Optional level */
  level: number,
  /** Title content */
  titleContent: string
};

const Title = ({ level, titleContent }: Props) => {
  const componentContent = level === 1 ? <h1>{titleContent.toUpperCase()}</h1> : <h2>{titleContent.toUpperCase()}</h2>;

  return <React.Fragment>{componentContent}</React.Fragment>;
};

Title.defaultProps = {
  level: 1,
  showtooltip: false
};

export default Title;