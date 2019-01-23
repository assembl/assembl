// @flow
import * as React from 'react';

// add DOM element with id "propscolor-color-hidden"
const addColor = (color: string) => {
  let body = document.getElementsByTagName('body')[0]; // eslint-disable-line

  let elementDOM = document.createElement('div'); // eslint-disable-line
  elementDOM.setAttribute('id', `${color}-color-hidden`);
  body.appendChild(elementDOM);
};

// remove DOM element with id "propscolor-color-hidden"
const removeColor = (color: string) => {
  let body = document.getElementsByTagName('body')[0]; // eslint-disable-line
  const elementDOM = document.getElementById(`${color}-color-hidden`);
  if (elementDOM) body.removeChild(elementDOM);
};

// get style from DOM element with id "propscolor-color-hidden"
const getStyle = (color: string) => {
  const elementDOM = document.querySelector(`#${color}-color-hidden`);
  const style = elementDOM ? getComputedStyle(elementDOM) : {};
  return style;
};

export type State = {
  firstStyle: Object,
  secondStyle: Object
};

// HOC to pass theme colors
const manageColor = (WrappedComponent: React.ComponentType<any>) => {
  class WrappedComponentWithColor extends React.Component<any, State> {
    state = {
      firstStyle: {},
      secondStyle: {}
    };

    componentWillMount() {
      addColor('first');
      addColor('second');
      this.setState({ firstStyle: getStyle('first'), secondStyle: getStyle('second') });
    }

    componentDidMount() {
      setTimeout(() => this.forceUpdate(), 2000);
    }

    componentWillUnmount() {
      removeColor('first');
      removeColor('second');
    }

    render() {
      const { firstStyle, secondStyle } = this.state;
      return <WrappedComponent {...this.props} firstColor={firstStyle.color} secondColor={secondStyle.color} />;
    }
  }
  return WrappedComponentWithColor;
};

export default manageColor;