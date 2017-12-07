// @flow

import * as React from 'react';
import { connect } from 'react-redux';

// Context Provider
class ResizeListener extends React.Component {
  componentDidMount() {
    const { updateScreenDimensions } = this.props;
    updateScreenDimensions();
    window.addEventListener('resize', updateScreenDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.props.updateScreenDimensions);
  }

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

/* remove this block when we update flow */

type StatelessFunctionalComponent<Props> = {
  (props: Props, context: any): React.Node,
  displayName?: ?string,
  propTypes?: $Subtype<{ [_: $Keys<Props>]: any }>,
  contextTypes?: any
};

type ComponentType<Props> = StatelessFunctionalComponent<Props> | Class<React.Component<Props, any, any>>;

type AnyComponent = ComponentType<any>;

/* end of block to be removed */

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