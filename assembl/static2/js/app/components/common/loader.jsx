// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import Ellipsis from '../svg/ellipsis';

export type Props = {
  color?: string,
  textHidden?: boolean
};

class Loader extends React.Component<Props> {
  static defaultProps = {
    textHidden: false
  };

  render() {
    return (
      <div className={this.props.textHidden ? 'loader-container-xs' : 'loader-container-xl'}>
        <div className="loader">
          {!this.props.textHidden && <Translate value="loading.wait" />}
          <div className="relative">
            <Ellipsis color={this.props.color} />
          </div>
        </div>
      </div>
    );
  }
}

export default Loader;