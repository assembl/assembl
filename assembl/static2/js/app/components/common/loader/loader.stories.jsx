// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, select } from '@storybook/addon-knobs';
/* eslint-enable */

import Loader, { LOADER_TYPE } from '../../common/loader/loader';
import type { Props as LoaderProps } from '../../common/loader/loader';

export const defaultLoaderProps: LoaderProps = {
  type: LOADER_TYPE.LOADING
};

const loaderErrorProps: LoaderProps = {
  ...defaultLoaderProps,
  type: LOADER_TYPE.ERROR
};

const loaderNoDataProps: LoaderProps = {
  ...defaultLoaderProps,
  type: LOADER_TYPE.NO_DATA
};

const playground = {
  type: [LOADER_TYPE.LOADING, LOADER_TYPE.ERROR, LOADER_TYPE.NO_DATA]
};

storiesOf('Semantic Analysis|Loader', module)
  .addDecorator(withKnobs)
  .add('default', () => <Loader {...defaultLoaderProps} />)
  .add('error', () => <Loader {...loaderErrorProps} />)
  .add('no data', () => <Loader {...loaderNoDataProps} />)
  .add('playground', () => <Loader type={select('type', playground.type, playground.type[0])} />);