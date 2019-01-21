// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, number } from '@storybook/addon-knobs';
/* eslint-enable */

import TitleWithTooltip from './titleWithTooltip';
import type { Props as TitleWithTooltipProps } from './titleWithTooltip';

export const defaultTitleWithTooltipProps: TitleWithTooltipProps = {
  children: 'An amazing title',
  level: 1,
  tooltipContent: <p>Here comes a tooltip</p>
};

const playground: TitleWithTooltipProps = {
  ...defaultTitleWithTooltipProps
};

storiesOf('TitleWithTooltip', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <TitleWithTooltip {...defaultTitleWithTooltipProps} />))
  .add(
    'playground',
    withInfo()(() => (
      <TitleWithTooltip level={number('title level', playground.level)} tooltipContent={playground.tooltipContent}>
        {text('title content', playground.children)}
      </TitleWithTooltip>
    ))
  );