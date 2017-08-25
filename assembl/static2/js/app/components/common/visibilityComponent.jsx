import React from 'react';

// FIXME: If we transform this class component into a functional component, IdeasLevel's scroll buttons visibility becomes buggy. Why?
class VisibilityComponent extends React.Component {
  render() {
    const { className, isVisible } = this.props;
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