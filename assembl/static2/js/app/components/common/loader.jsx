import React from 'react';
import { Translate } from 'react-redux-i18n';

class Loader extends React.Component {
  render() {
    return (
      <div className={this.props.textHidden ? 'loader' : 'loader margin-xxl'}>
        <div className={this.props.textHidden ? 'hidden' : ''}><Translate value="loading.wait" /></div>
        <img src="../../../../static2/css/img/loader.svg" alt="loader" />
      </div>
    );
  }
}

export default Loader;