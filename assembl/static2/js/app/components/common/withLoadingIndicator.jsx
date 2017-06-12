/* Higher order component that displays an empty div if props.data.loading is true and else displays the wrapped component */
import React from 'react';

const withLoadingIndicator = (WrappedComponent) => {
  return (props) => {
    if (props.data.loading) {
      return <div />;
    }
    return <WrappedComponent {...props} />;
  };
};

export default withLoadingIndicator;