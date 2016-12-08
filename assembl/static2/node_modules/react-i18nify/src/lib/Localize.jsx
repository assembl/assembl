/* eslint no-underscore-dangle: "off" */

import React from 'react';
import I18n from './I18n';
import BaseComponent from './Base';

export default class Localize extends BaseComponent {

  static propTypes = {
    value: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.object]).isRequired,
    options: React.PropTypes.object,
    dateFormat: React.PropTypes.string,
  };

  render = () => (
    <span>
      {I18n._localize(
        this.props.value,
        this.props.dateFormat
          ? { dateFormat: this.props.dateFormat }
          : this.props.options
      )}
    </span>
  );
}
