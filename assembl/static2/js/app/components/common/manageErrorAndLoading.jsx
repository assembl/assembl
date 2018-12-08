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

type Props = {
  displayLoader: boolean,
  customLoader?: React.Node,
  customLoaderProps?: Object
} & LoaderProps;

type WrappedProps = {
  data: { error?: ?Error, loading?: boolean } & any,
  error?: ?Error,
  loading?: boolean
};

const manageErrorAndLoading = (props: Props) => (WrappedComponent: React.ComponentType<any>) => (wrappedProps: WrappedProps) => {
  const { data, error, loading } = wrappedProps;
  if (error || (data && data.error)) {
    const graphqlError = error || data.error;
    if (graphqlError) {
      throw new Error(`GraphQL error: ${graphqlError.message}`);
    }
  }

  if (loading || (data && data.loading)) {
    if (props.displayLoader) {
      if (props.customLoader) {
        return props.customLoaderProps ? <customLoader {...props.customLoaderProps} /> : <customLoader />;
      }

      return <Loader {...props} />;
    }

    return null;
  }

  return <WrappedComponent {...wrappedProps} />;
};

export default manageErrorAndLoading;