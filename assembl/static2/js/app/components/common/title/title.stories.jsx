// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, text, number } from '@storybook/addon-knobs';
/* eslint-enable */

import Title from './title';
import type { Props as TitleProps } from './title';

export const defaultTitleProps: TitleProps = {
  level: 1,
  children: 'My awesome title'
};

const playground: TitleProps = {
  ...defaultTitleProps
};

storiesOf('Semantic Analysis|Title', module)
  .addDecorator(withKnobs)
  .add('default', () => <Title {...defaultTitleProps} />)
  .add('playground', () => (
    <Title level={number('title level', playground.level)}>{text('title content', playground.children)}</Title>
  ));