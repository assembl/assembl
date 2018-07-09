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
  handleToggle: Function,
  cookie: CookieObject
};


const CookieToggle = ({ handleToggle, cookie }: CookieToggleProps) => {
  const toggleSwitch = () => {
    const updatedCookie = { ...cookie, accepted: !cookie.accepted };
    handleToggle(updatedCookie);
  };

  const { name, category, accepted } = cookie;

  return (
    <div className="cookie-toggle">
      <Translate className="cookie-title dark-title-3 ellipsis" value={`cookies.${name}`} />
      <SwitchButton
        label={I18n.t('refuse')}
        labelRight={I18n.t('accept')}
        onChange={toggleSwitch}
        checked={!accepted}
        disabled={category === 'essential'}
        name={name}
      />
    </div>
  );
};

export default CookieToggle;