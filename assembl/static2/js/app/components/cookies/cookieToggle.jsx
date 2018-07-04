// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import SwitchButton from '../common/switchButton';

type CookieToggleProps = {
  isEssential: boolean,
  name: string
};

type CookieToggleState = {
  accepted: boolean
};

class CookieToggle extends React.Component<CookieToggleProps, CookieToggleState> {
  constructor(props: CookieToggleProps) {
    super(props);
    this.state = {
      accepted: true
      // this local state is temporary, backend should provide this value to the
      // parent component and it will be passed down as a prop
    };
  }

  toggleSwitch = () => {
    const { accepted } = this.state;
    const { handleToggle, name } = this.props;

    this.setState({ accepted: !accepted });
    handleToggle(name, !accepted);
  };

  render() {
    const { accepted } = this.state;
    const { name, isEssential } = this.props;
    return (
      <div className="cookie-toggle">
        <div className="cookie-title dark-title-3 ellipsis">{name}</div>
        <SwitchButton
          label={I18n.t('refuse')}
          labelRight={I18n.t('accept')}
          onChange={this.toggleSwitch}
          checked={!accepted}
          disabled={isEssential}
          name={name}
        />
      </div>
    );
  }
}

export default CookieToggle;