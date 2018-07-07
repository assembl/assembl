// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import SwitchButton from '../common/switchButton';


export type CookieObject = {
  name: string,
  category: string,
  accepted: boolean
}

type CookieToggleProps = {
  isEssential: boolean,
  accepted: boolean,
  handleToggle: Function,
  cookie: CookieObject
};

type CookieToggleState = {
  accepted: boolean,
};

class CookieToggle extends React.Component<CookieToggleProps, CookieToggleState> {
  constructor(props: CookieToggleProps) {
    super(props);
    this.state = {
      accepted: props.accepted
    };
  }

  toggleSwitch = () => {
    const { accepted } = this.state;
    const { handleToggle, cookie } = this.props;
    this.setState({ accepted: !accepted });
    cookie.accepted = !accepted;
    handleToggle(cookie);
  };

  render() {
    const { accepted } = this.state;
    const { cookie: { name }, isEssential } = this.props;
    return (
      <div className="cookie-toggle">
        <Translate className="cookie-title dark-title-3 ellipsis" value={`cookies.${name}`} />
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