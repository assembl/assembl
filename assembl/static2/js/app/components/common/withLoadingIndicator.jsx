/* Higher order component that displays the loader component if props.data.loading is true and else displays the wrapped component */
import React from 'react';
import Loader from './loader';

const withLoadingIndicator = (WrappedComponent) => {
  return (props) => {
    if (props.data.loading) {
      return <Loader />;
    }
    return <WrappedComponent {...props} />;
  };
};

export default withLoadingIndicator;