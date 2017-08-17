import React from 'react';

class VisibilityComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: props.isVisible
    };
  }
  render() {
    const { className } = this.props;
    const { isVisible } = this.state;
    const myClassNames = isVisible === true ? className : `${className} hidden`;
    return (
      <div className={myClassNames}>
        {this.props.children}
      </div>
    );
  }
}

VisibilityComponent.defaultProps = { isVisible: true };

export default VisibilityComponent;