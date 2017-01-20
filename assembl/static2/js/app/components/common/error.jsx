import React from 'react';
import { Translate } from 'react-redux-i18n';

class Error extends React.Component {
  render() {
    return (
      <div>
        <p><b><Translate value="error.reason" /></b>&nbsp;&quot;{this.props.errorMessage}&quot;</p>
      </div>
    );
  }
}

export default Error;