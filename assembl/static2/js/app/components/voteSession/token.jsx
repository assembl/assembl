import React from 'react';

class Token extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: true
    };
  }

  render() {
    const { color } = this.props;
    const { active } = this.state;
    const tokenClassNames = active ? 'token token-active' : 'token';
    return <div className={tokenClassNames} style={{ color: color, borderColor: color }} />;
  }
}

export default Token;