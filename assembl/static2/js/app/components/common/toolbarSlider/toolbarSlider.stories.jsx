// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { action } from '@storybook/addon-actions';
import { color, number, withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import ToolbarSlider from './toolbarSlider';

export const defaultToolbarSliderProps = {
  defaultValue: 50,
  onSliderChange: action('onSliderChange')
};

const playground = {
  color: '#000',
  defaultValue: 30,
  max: 90,
  min: 0,
  onSliderChange: action('onSliderChange')
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
        color={color('color', playground.color)}
        defaultValue={number('defaultValue', playground.defaultValue)}
        max={number('max', playground.max)}
        min={number('min', playground.min)}
        onSliderChange={playground.onSliderChange}
      />
    ))
  );