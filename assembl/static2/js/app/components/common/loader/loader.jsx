// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
// Component imports
import LoadingIcon from '../icons/loadingIcon/loadingIcon';
import ErrorIcon from '../icons/errorIcon/errorIcon';
import NoDataIcon from '../icons/noDataIcon/noDataIcon';

type LoaderType = {
  loaderComponent: React.Node,
  description: string
};

export const LOADER_TYPE = {
  LOADING: 'LOADING',
  ERROR: 'ERROR',
  NO_DATA: 'NO_DATA'
};

export type Props = {
  /** Loader type of type LOADER_TYPE (LOADING, ERROR, NO_DATA) */
  type: $Keys<typeof LOADER_TYPE>
};

const Loader = ({ type }: Props) => {
  // Loaders Content
  const LoaderTypeLoading: LoaderType = {
    description: I18n.t('common.loader.loading'),
    loaderComponent: <LoadingIcon />
  };
  const LoaderTypeError: LoaderType = {
    description: I18n.t('common.loader.error'),
    loaderComponent: <ErrorIcon />
  };
  const LoaderTypeNoData: LoaderType = {
    description: I18n.t('common.loader.no-data'),
    loaderComponent: <NoDataIcon />
  };
  const LOADER_TYPE_CONTENT = {
    LOADING: LoaderTypeLoading,
    ERROR: LoaderTypeError,
    NO_DATA: LoaderTypeNoData
  };

  let loaderContent;
  switch (type) {
  case LOADER_TYPE.LOADING:
    loaderContent = LOADER_TYPE_CONTENT.LOADING;
    break;
  case LOADER_TYPE.NO_DATA:
    loaderContent = LOADER_TYPE_CONTENT.NO_DATA;
    break;
  default:
    loaderContent = LOADER_TYPE_CONTENT.ERROR;
  }
  const { description, loaderComponent } = loaderContent;

  return (
    <div className="custom-loader center">
      {loaderComponent}
      <p className="description center">{description}</p>
    </div>
  );
};

export default Loader;