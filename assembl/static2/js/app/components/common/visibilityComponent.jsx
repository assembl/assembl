import React from 'react';

class VisibilityComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: 'isVisible' in props ? props.isVisible : true
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

export default VisibilityComponent;