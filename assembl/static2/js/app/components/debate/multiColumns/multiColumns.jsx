// @flow
import * as React from 'react';

type Props = {
  children: any
};

const MultiColumns = ({ children }: Props) => {
  const width = `${100 / children.length}%`;
  const newChildren = React.Children.map(children, child =>
    React.cloneElement(child, {
      width: width
    })
  );
  return (
    <div id="multi-column" className="multi-column-container">
      {newChildren}
    </div>
  );
};

export default MultiColumns;