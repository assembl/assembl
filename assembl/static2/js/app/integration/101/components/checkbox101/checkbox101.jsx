// @flow
import React from 'react';

type Props = {
  label?: string, // Optional checkbox label
  onChangeHandler: Function // Required onChange function
};

const checkbox101 = ({
  label,
  onChangeHandler
}: Props) => (
  <div className="integration checkbox">
    <input id="checkbox" type="checkbox" onChange={onChangeHandler} />
    <label htmlFor="checkbox">
      {label}
    </label>
  </div>
);

checkbox101.defaultProps = {
  label: 'Default'
};

export default checkbox101;