// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
// Component imports
import LoadingIcon from './icons/loadingIcon/loadingIcon';
import ErrorIcon from './icons/errorIcon/errorIcon';

type LoaderType = {
  loaderComponent: React.Node,
  description: string
};

const LoaderTypeLoading: LoaderType = {
  description: I18n.t('common.loader.loading'),
  loaderComponent: <LoadingIcon />
};

const LoaderTypeError: LoaderType = {
  description: I18n.t('common.loader.error'),
  loaderComponent: <ErrorIcon />
};

export const LOADER_TYPE = {
  LOADING: 'LOADING',
  ERROR: 'ERROR'
};

export const LOADER_TYPE_CONTENT = {
  LOADING: LoaderTypeLoading,
  ERROR: LoaderTypeError
};

export type Props = {
  /** Loader type of type LOADER_TYPE (LOADING, ERROR) */
  type: $Keys<typeof LOADER_TYPE>
};

const Loader = ({ type }: Props) => {
  const { description, loaderComponent } = type === LOADER_TYPE.LOADING ? LOADER_TYPE_CONTENT.LOADING : LOADER_TYPE_CONTENT.ERROR;

  return (
    <div className="custom-loader">
      {loaderComponent}
      <p>{description}</p>
    </div>
  );
};

export default Loader;