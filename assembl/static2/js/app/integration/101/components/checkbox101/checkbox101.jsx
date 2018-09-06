// @flow
import React from 'react';

export type Checkbox101Type = {
  /**  Checkbox label */
  label?: string,
  /** Checkbox state */
  isDone?: boolean,
  /** onChange function */
  onChangeHandler: Function
};

const Checkbox101 = ({ label, isDone, onChangeHandler }: Checkbox101Type) => (
  <div className="integration checkbox">
    <input id="checkbox" type="checkbox" onChange={onChangeHandler} checked={isDone} />
    <label htmlFor="checkbox">{label}</label>
  </div>
);

Checkbox101.defaultProps = {
  label: 'Default',
  isDone: false
};

export default Checkbox101;