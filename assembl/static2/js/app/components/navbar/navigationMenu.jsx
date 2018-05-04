// @noflow

import * as React from 'react';

class NavigationMenu extends React.Component<$FlowFixMeProps> {
  render() {
    const { elements } = this.props;
    return <div className="nav-menu">{elements}</div>;
  }
}

export default NavigationMenu;