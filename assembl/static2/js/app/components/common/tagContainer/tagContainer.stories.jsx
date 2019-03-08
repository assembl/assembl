// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, object, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

import TagContainer from './tagContainer';
import type { Props as tagContainerProps } from './tagContainer';

export const defaultProps: tagContainerProps = {
  isAdmin: false,
  postId: '0',
  tagList: [{ id: '0', text: 'Habitat et SDF' }, { id: '1', text: 'Facilitation' }],
  onTagListUpdateCallback: action('onTagListUpdateCallback')
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
  .add('playground', () => (
    <TagContainer
      isAdmin={boolean('Is admin?', playground.isAdmin)}
      postId={playground.postId}
      tagList={object('List of tags', playground.tagList)}
      onTagListUpdateCallback={playground.onTagListUpdateCallback}
    />
  ));