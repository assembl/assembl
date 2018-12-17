// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';

type Props = {
  updateScreenDimensions: () => void,
  children: React.Node
};

// Context Provider
class ResizeListener extends React.Component<Props> {
  componentDidMount() {
    this.updateScreenDimensions();
    window.addEventListener('resize', this.updateScreenDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateScreenDimensions);
  }

  updateScreenDimensions = debounce(() => {
    this.props.updateScreenDimensions();
  }, 200);

  render() {
    // This prevents the component from having more than one child
    return React.Children.only(this.props.children);
  }
}

export const ScreenDimensionsProvider = connect(null, dispatch => ({
  updateScreenDimensions: () => {
    dispatch({
      type: 'UPDATE_SCREEN_DIMENSIONS',
      newWidth: window.innerWidth,
      newHeight: window.innerHeight
    });
  }
}))(ResizeListener);

type AnyComponent = React.ComponentType<any>;

// HOC
export const withScreenWidth = (WrappedComponent: AnyComponent) =>
  connect(({ screenWidth }) => ({
    screenWidth: screenWidth
  }))(WrappedComponent);

export const withScreenHeight = (WrappedComponent: AnyComponent) =>
  connect(({ screenHeight }) => ({
    screenHeight: screenHeight
  }))(WrappedComponent);

export const withScreenDimensions = (WrappedComponent: AnyComponent) =>
  connect(({ screenWidth, screenHeight }) => ({
    screenWidth: screenWidth,
    screenHeight: screenHeight
  }))(WrappedComponent);