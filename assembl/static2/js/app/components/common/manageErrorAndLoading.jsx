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
import WatsonLoader, { LOADER_TYPE as LOADER_TYPE_WATSON } from './loader/loader';

type Props = {
  displayLoader: boolean,
  /** Optional type */
  loaderType?: string
} & LoaderProps;

type WrappedProps = {
  data: { error?: ?Error, loading?: boolean } & any,
  error?: ?Error,
  loading?: boolean
};

// Takes the type and return the right loader for error and loading
const switchLoaderToShow = (loaderType?: string, propsToPass: Props) => {
  const type = loaderType || '';
  switch (type) {
  case 'watson': {
    return {
      ERROR: () => <WatsonLoader type={LOADER_TYPE_WATSON.ERROR} />,
      LOADING: () => <WatsonLoader type={LOADER_TYPE_WATSON.LOADING} />
    };
  }
  default: {
    return {
      ERROR: () => {
        throw new Error('GraphQL error');
      },
      LOADING: () => <Loader {...propsToPass} />
    };
  }
  }
};

const manageErrorAndLoading = (props: Props) => (WrappedComponent: React.ComponentType<any>) => (wrappedProps: WrappedProps) => {
  const { data, error, loading } = wrappedProps;
  const { loaderType } = props;

  const loaderToShow = switchLoaderToShow(loaderType, props);

  // ERROR
  if (error || (data && data.error)) {
    const graphqlError = error || data.error;
    if (graphqlError) {
      loaderToShow.ERROR();
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

export default manageErrorAndLoading;