// @flow
import React from 'react';

type TokenProps = {
  color: string
};

type TokenState = {
  active: boolean
};

class Token extends React.Component<Object, TokenProps, TokenState> {
  props: TokenProps;

  state: TokenState;

  static defaultProps = {
    color: '#B8E986'
  };

  constructor(props: TokenProps) {
    super(props);
    this.state = {
      active: true
    };
  }

  render() {
    const { color } = this.props;
    const { active } = this.state;
    const tokenClassNames = active ? 'token token-active' : 'token';
    const tokenStyle = this.state.active ? { borderColor: color, backgroundColor: color } : { borderColor: color };

    return <div className={tokenClassNames} style={tokenStyle} />;
  }
}

export default Token;