// @flow
import * as React from 'react';
import classNames from 'classnames';

export type Props = {
  /** Description content */
  children: React.Node,
  /** Optional added classes */
  className?: ?string
};

const Description = ({ children, className }: Props) => <div className={classNames('description', className)}>{children}</div>;

Description.defaultProps = {
  className: null
};

export default Description;