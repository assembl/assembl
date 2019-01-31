// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
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
  .add('default', withInfo()(() => <Loader {...defaultLoaderProps} />))
  .add('error', withInfo()(() => <Loader {...loaderErrorProps} />))
  .add('no data', withInfo()(() => <Loader {...loaderNoDataProps} />))
  .add('playground', withInfo()(() => <Loader type={select('type', playground.type, playground.type[0])} />));