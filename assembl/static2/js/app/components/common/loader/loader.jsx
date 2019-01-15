// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
// Component imports
import LoadingIcon from './icons/loadingIcon/loadingIcon';

type LoaderType = {
  loaderComponent: React.Node,
  description: string
};

const LoaderTypeLoading: LoaderType = {
  description: I18n.t('common.loader.loading'),
  loaderComponent: <LoadingIcon />
};

export const LOADER_TYPE = {
  LOADING: 'LOADING'
};

export const LOADER_TYPE_CONTENT = {
  LOADING: LoaderTypeLoading
};

export type Props = {
  /** Loader type of type LOADER_TYPE (LOADING, ERROR) */
  type: $Keys<typeof LOADER_TYPE>
};

const Loader = () => {
  const { description, loaderComponent } = LOADER_TYPE_CONTENT.LOADING;

  return (
    <div className="custom-loader">
      {loaderComponent}
      <p>{description}</p>
    </div>
  );
};

export default Loader;