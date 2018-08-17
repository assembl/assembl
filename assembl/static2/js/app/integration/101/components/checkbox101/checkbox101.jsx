// @flow
import React from 'react';

type Props = {
  /**  Optional checkbox label */
  label?: string,
  /** Optional checkbox state */
  isDone?: boolean,
  /** Required onChange function */
  onChangeHandler: Function
};

const checkbox101 = ({
  label,
  isDone,
  onChangeHandler
}: Props) => (
  <div className="integration checkbox">
    <input
      id="checkbox"
      type="checkbox"
      onChange={onChangeHandler}
      checked={isDone}
    />
    <label htmlFor="checkbox">
      {label}
    </label>
  </div>
);

checkbox101.defaultProps = {
  label: 'Default',
  isDone: false
};

export default checkbox101;