// @flow
import React from 'react';

type Props = {
  label?: string, // Optional checkbox label
  isDone?: boolean, // Optional checkbox state
  onChangeHandler: Function // Required onChange function
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