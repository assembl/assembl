import React from 'react';

class VisibilityComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible || true
    };
  }
  render() {
    return (
      <div className={this.state.isVisible ? '' : 'hidden'}>
        {this.props.children}
      </div>
    );
  }
}

export default VisibilityComponent;