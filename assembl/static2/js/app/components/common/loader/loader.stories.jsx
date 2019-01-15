// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import Loader, { LOADER_TYPE } from '../../common/loader/loader';
import type { Props as LoaderProps } from '../../common/loader/loader';

export const defaultLoaderProps: LoaderProps = {
  type: LOADER_TYPE.LOADING
};

storiesOf('Loader', module).add('default', withInfo()(() => <Loader {...defaultLoaderProps} />));