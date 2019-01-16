// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import ToolbarSliderIcon from './toolbarSliderIcon';
import type { Props as ToolbarSliderIconProps } from './toolbarSliderIcon';

export const defaultToolbarSliderIconProps: ToolbarSliderIconProps = {
  value: '',
  classText: ''
};

const playground = {
  value: '50 %',
  classText: 'classTest'
};

storiesOf('ToolbarSliderIcon', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <ToolbarSliderIcon />))
  .add(
    'playground',
    withInfo()(() => (
      <ToolbarSliderIcon value={text('value', playground.value)} classText={text('classText', playground.classText)} />
    ))
  );