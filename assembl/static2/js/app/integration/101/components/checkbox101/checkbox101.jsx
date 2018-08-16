// @flow
import React from 'react';

type Props = {
  checked?: boolean // Optional flag to check the checkbox
};

const checkbox101 = ({
  checked
}: Props) => (
  <div className="integration checkbox">
    <input id="checkbox" type="checkbox" checked={checked} />
    <label htmlFor="checkbox">
      Default
    </label>
  </div>
);

checkbox101.defaultProps = {
  checked: false
};

export default checkbox101;