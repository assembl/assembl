// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
/* eslint-enable */

import TagContainer from './tagContainer';
import type { Props as tagContainerProps } from './tagContainer';

export const defaultProps: tagContainerProps = {
  tagList: ['Habitat et SDF', 'Facilitation']
};

storiesOf('Tag On Post|TagContainer', module).add('default', () => <TagContainer {...defaultProps} />);