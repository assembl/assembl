// @flow
import * as React from 'react';

export type Props = {
  /** Description content */
  children: React.Node
};

const Description = ({ children }: Props) => <div className="description">{children}</div>;

export default Description;