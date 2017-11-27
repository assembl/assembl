import React from 'react';
import { connect } from 'react-redux';

import { connectedUserIsAdmin } from '../../utils/permissions';

class NavigationMenu extends React.Component {
  // This redirection should be removed when the phase 2 will be done
  render() {
    const { elements, className } = this.props;
    return <div className={className}>{elements}</div>;
  }
}

const mapStateToProps = (state) => {
  return {
    isAdmin: connectedUserIsAdmin(),
    debate: state.debate,
    phase: state.phase,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(NavigationMenu);