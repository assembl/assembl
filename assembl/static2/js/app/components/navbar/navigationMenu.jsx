// @flow
import * as React from 'react';

type Props = {
  elements: React.Node
};

class NavigationMenu extends React.Component<Props> {
  render() {
    const { elements } = this.props;
    return <div className="nav-menu">{elements}</div>;
  }
}

export default NavigationMenu;