// @flow
import * as React from 'react';

type Props = {
  classname: string,
  isVisible: boolean,
  children: React.Node
};

const VisibilityComponent = ({ classname, isVisible, children }: Props) => (
  <div className={isVisible ? classname : 'hidden'}>{children}</div>
);

export default VisibilityComponent;