import React from 'react';

class VisibilityComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible || true
    };
  }
  render() {
    const classNames = this.props.className;
    return (
      <div className={this.state.isVisible ? classNames : `${classNames} hidden`}>
        {this.props.children}
      </div>
    );
  }
}

export default VisibilityComponent;