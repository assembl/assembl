// @flow
import React from 'react';

export type Props = {
  level: number,
  children: string
};

const Title = ({ level, children }: Props) =>
  (level === 1 ? <h1>{children.toUpperCase()}</h1> : <h2>{children.toUpperCase()}</h2>);

Title.defaultProps = {
  level: 1
};

export default Title;