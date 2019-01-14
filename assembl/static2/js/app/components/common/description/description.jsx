// @flow
import * as React from 'react';

export type Props = {
  children?: React.Node
};

const Description = ({ children }: Props) => <div className="description">{children}</div>;

Description.defaultProps = {
  children: <div />
};

export default Description;