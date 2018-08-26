// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, object } from '@storybook/addon-knobs';
/* eslint-enable */

import CheckboxList101 from './checkboxList101';
import { defaultCheckbox } from '../checkbox101/checkbox101.stories';
import type { CheckboxList101Type } from './checkboxList101';
import type { Checkbox101Type } from '../checkbox101/checkbox101';

const listOfcheckboxes: Array<Checkbox101Type> = [
  { ...defaultCheckbox, label: 'AAA', isDone: false },
  { ...defaultCheckbox, label: 'BBB', isDone: false },
  { ...defaultCheckbox, label: 'CCC', isDone: true },
  { ...defaultCheckbox, label: 'DDD', isDone: false },
  { ...defaultCheckbox, label: 'EEE', isDone: false }
];

const listOf5Checkboxes: CheckboxList101Type = {
  checkboxes: listOfcheckboxes
};

const emptyListOfCheckboxes: CheckboxList101Type = {
  checkboxes: []
};

storiesOf('CheckboxList101', module)
  .addDecorator(withKnobs)
  .add('List of 5', withInfo()(() => <CheckboxList101 {...listOf5Checkboxes} />))
  .add('Empty list', withInfo()(() => <CheckboxList101 {...emptyListOfCheckboxes} />))
  .add('playground', withInfo()(() => <CheckboxList101 checkboxes={object('checkboxes', listOfcheckboxes)} />));