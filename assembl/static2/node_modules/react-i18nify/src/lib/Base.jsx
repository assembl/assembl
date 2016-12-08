import React from 'react';

export default class Base extends React.Component {

  static instances = [];

  static rerenderAll() {
    Base.instances.forEach(instance => instance.forceUpdate());
  }

  componentWillMount() {
    Base.instances.push(this);
  }

  componentWillUnmount() {
    Base.instances.splice(Base.instances.indexOf(this), 1);
  }
}
