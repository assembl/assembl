// @flow
import * as React from 'react';

export type Props = {
  /** Title level with default value set to 1 */
  level: number,
  /** Title content */
  children: string
};

const Title = ({ level, children }: Props) => {
  const componentContent = level === 1 ? <h1>{children}</h1> : <h2>{children}</h2>;

  return <React.Fragment>{componentContent}</React.Fragment>;
};

Title.defaultProps = {
  level: 1
};

export default Title;