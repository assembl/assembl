// @flow
/*
  Higher order component that:
  - if there is a graphql error throws it (this error will be handled by an error boundary component)
  - if loading is true displays the loader component or nothing
  - Can pass custom Loader component to override the default
  - if there is no error and loading is false displays the wrapped component
*/
import * as React from 'react';
import Loader, { type Props as LoaderProps } from './loader';
import SemanticAnalysisLoader, { LOADER_TYPE as LOADER_TYPE_WATSON } from './loader/loader';

export const TYPE = {
  SEMANTIC_ANALYSIS: 'SEMANTIC_ANALYSIS',
  NO_ERROR: 'NO_ERROR'
};

type Props = {
  displayLoader: boolean,
  /** Optional type */
  loaderType?: $Keys<typeof TYPE>
} & LoaderProps;

type WrappedProps = {
  data: { error?: ?Error, loading?: boolean } & any,
  error?: ?Error,
  loading?: boolean
};

// Return the right loader to display for error and loading according
const getLoaderToDisplay = (propsToPass: Props) => {
  const { loaderType } = propsToPass;

  switch (loaderType) {
  case TYPE.SEMANTIC_ANALYSIS: {
    return {
      // eslint-disable-next-line no-unused-vars
      ERROR: graphqlError => <SemanticAnalysisLoader type={LOADER_TYPE_WATSON.ERROR} />,
      LOADING: () => <SemanticAnalysisLoader type={LOADER_TYPE_WATSON.LOADING} />
    };
  }
  case TYPE.NO_ERROR: {
    return {
      LOADING: () => <Loader {...propsToPass} />,
      // eslint-disable-next-line no-unused-vars
      ERROR: graphqlError => <Loader {...propsToPass} />
    };
  }
  default: {
    return {
      ERROR: (graphqlError) => {
        throw new Error(`GraphQL error: ${graphqlError.message}`);
      },
      LOADING: () => <Loader {...propsToPass} />
    };
  }
  }
};

const manageErrorAndLoading = (props: Props) => (WrappedComponent: React.ComponentType<any>) => (wrappedProps: WrappedProps) => {
  const { data, error, loading } = wrappedProps;

  const loaderToShow = getLoaderToDisplay(props);

  // ERROR
  if (error || (data && data.error)) {
    const graphqlError = error || data.error;
    if (graphqlError) {
      loaderToShow.ERROR(graphqlError);
    }
  }
  // LOADING
  if (loading || (data && data.loading)) {
    return props.displayLoader ? loaderToShow.LOADING() : null;
  }
  // WRAPPED COMPONENT
  return <WrappedComponent {...wrappedProps} />;
};

manageErrorAndLoading.defaultProps = {
  loaderType: 'default'
};

export const manageErrorOnly = (WrappedComponent: React.ComponentType<any>) => (wrappedProps: WrappedProps) => {
  const { error } = wrappedProps;
  if (error) {
    throw new Error(`GraphQL error: ${error.message}`);
  }
  return <WrappedComponent {...wrappedProps} />;
};

export const manageLoadingOnly = (WrappedComponent: React.ComponentType<any>) => (wrappedProps: WrappedProps) => {
  const { data, error, loading } = wrappedProps;
  const loaderToShow = getLoaderToDisplay({ displayLoader: true, loaderType: TYPE.NO_ERROR });
  // LOADING
  if (loading || (data && data.loading)) {
    return loaderToShow.LOADING();
  }
  // WRAPPED COMPONENT
  const propsToSend = { ...wrappedProps, ...data, error: error };
  return <WrappedComponent {...propsToSend} />;
};

export default manageErrorAndLoading;