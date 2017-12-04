/*
  Higher order component that displays nothing if
  props.data.loading is true and else displays the wrapped component
*/
import React from 'react';

const withoutLoadingIndicator = () => {
  return (WrappedComponent) => {
    return (props) => {
      if (props.loading || (props.data && props.data.loading)) {
        return null;
      }
      return <WrappedComponent {...props} />;
    };
  };
};

export default withoutLoadingIndicator;