// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import SwitchButton from '../common/switchButton';
import { COOKIE_TRANSLATION_KEYS } from '../../constants';


export type CookieObject = {
  name: string,
  category: string,
  accepted: boolean,
  cookieType: string
}

type CookieToggleProps = {
  handleToggle: Function,
  cookie: CookieObject
};


const CookieToggle = ({ handleToggle, cookie, toggleCookieType }: CookieToggleProps) => {
  const toggleSwitch = () => {
    const { accepted, cookieType } = cookie;
    const updatedCookie = { ...cookie, accepted: !accepted, cookieType: toggleCookieType(cookieType) };
    handleToggle(updatedCookie);
  };

  const { name, category, accepted } = cookie;

  const cookieName = Object.keys(COOKIE_TRANSLATION_KEYS).includes(name) ? I18n.t(`cookies.${name}`) : name;

  return (
    <div className="cookie-toggle">
      <span className="cookie-title dark-title-3 ellipsis">{cookieName}</span>
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