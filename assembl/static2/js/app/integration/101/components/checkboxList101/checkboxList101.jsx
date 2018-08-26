// @flow
import React, { Fragment } from 'react';
import Checkbox101 from '../checkbox101/checkbox101';
import type { Checkbox101Type } from '../checkbox101/checkbox101';

export type CheckboxList101Type = {
  /** List of checkboxes to display */
  checkboxes: Array<Checkbox101Type>
};

const checkboxList101 = ({ checkboxes }: CheckboxList101Type) => {
  if (checkboxes.length === 0) {
    return <Fragment>Nothing to display</Fragment>;
  }

  return (
    <Fragment>
      {checkboxes.map(checkbox => (
        <Checkbox101
          key={Math.random()
            .toString(36)
            .substring(7)}
          label={checkbox.label}
          isDone={checkbox.isDone}
          onChangeHandler={checkbox.onChangeHandler}
        />
      ))}
    </Fragment>
  );
};

export default checkboxList101;