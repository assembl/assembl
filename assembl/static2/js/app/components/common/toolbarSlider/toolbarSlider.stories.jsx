// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';
import { withKnobs, number, color } from '@storybook/addon-knobs';
/* eslint-enable */

import ToolbarSlider from './toolbarSlider';
import type { Props as ToolbarSliderProps } from './toolbarSlider';

export const defaultToolbarSliderProps: ToolbarSliderProps = {
  defaultValue: 50,
  onSliderChange: action('onSliderChange')
};

const playground = {
  min: 0,
  max: 90,
  defaultValue: 30,
  onSliderChange: action('onSliderChange'),
  color: '#000'
};

storiesOf('ToolbarSlider', module)
  .addDecorator(withKnobs)
  .add(
    'default',
    withInfo()(() => (
      <ToolbarSlider
        defaultValue={defaultToolbarSliderProps.defaultValue}
        onSliderChange={defaultToolbarSliderProps.onSliderChange}
      />
    ))
  )
  .add(
    'playground',
    withInfo()(() => (
      <ToolbarSlider
        min={number('min', playground.min)}
        max={number('max', playground.max)}
        defaultValue={number('defaultValue', playground.defaultValue)}
        onSliderChange={playground.onSliderChange}
        color={color('color', playground.color)}
      />
    ))
  );