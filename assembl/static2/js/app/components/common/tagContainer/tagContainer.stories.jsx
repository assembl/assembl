// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

import TagContainer from './tagContainer';
import type { Props as tagContainerProps } from './tagContainer';

export const defaultProps: tagContainerProps = {
  isAdmin: false,
  postId: '0'
};

const adminProps: tagContainerProps = {
  ...defaultProps,
  isAdmin: true
};

const playground: tagContainerProps = {
  ...defaultProps
};

storiesOf('Tag On Post|TagContainer', module)
  .addDecorator(withKnobs)
  .add('default', () => <TagContainer {...defaultProps} />)
  .add('admin', () => <TagContainer {...adminProps} />)
  .add('playground', () => <TagContainer isAdmin={boolean('Is admin?', playground.isAdmin)} postId={playground.postId} />);