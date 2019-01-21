// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, number } from '@storybook/addon-knobs';
/* eslint-enable */

import Title from './title';
import type { Props as TitleProps } from './title';

export const defaultTitleProps: TitleProps = {
  level: 1,
  children: 'my awesome title'
};

const playground: TitleProps = {
  ...defaultTitleProps
};

storiesOf('Title', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <Title {...defaultTitleProps} />))
  .add(
    'playground',
    withInfo()(() => <Title level={number('title level', playground.level)}>{text('title content', playground.children)}</Title>)
  );