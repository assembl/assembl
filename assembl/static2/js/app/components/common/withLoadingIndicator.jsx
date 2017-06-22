/* Higher order component that displays the loader component if props.data.loading is true and else displays the wrapped component */
import React from 'react';
import Loader from './loader';

const withLoadingIndicator = (loaderProps = {}) => {
  return (WrappedComponent) => {
    return (props) => {
      if (props.data.loading) {
        return <Loader {...loaderProps} />;
      }
      return <WrappedComponent {...props} />;
    };
  };
};

export default withLoadingIndicator;