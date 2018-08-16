// @flow
import React from 'react';

type Props = {
  checked?: boolean, // Optional flag to check the checkbox
  label?: string // Optional checkbox label
};

const checkbox101 = ({
  checked,
  label
}: Props) => (
  <div className="integration checkbox">
    <input id="checkbox" type="checkbox" checked={checked} />
    <label htmlFor="checkbox">
      {label}
    </label>
  </div>
);

checkbox101.defaultProps = {
  checked: false,
  label: 'Default'
};

export default checkbox101;