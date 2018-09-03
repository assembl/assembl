// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import SwitchButton from '../common/switchButton';
import { COOKIE_TRANSLATION_KEYS, matomoOptOutLink } from '../../constants';

export type CookieObject = {
  name: string,
  category: string,
  accepted: boolean,
  cookieType: string
};

type CookieToggleProps = {
  handleToggle: Function,
  cookie: CookieObject,
  toggleCookieType: Function,
  locale: string
};

const CookieToggle = ({ handleToggle, cookie, toggleCookieType, locale }: CookieToggleProps) => {
  const toggleSwitch = () => {
    const { accepted, cookieType } = cookie;
    const updatedCookie = { ...cookie, accepted: !accepted, cookieType: toggleCookieType(cookieType) };
    handleToggle(updatedCookie);
  };

  const { name, category, accepted } = cookie;

  const cookieName = Object.keys(COOKIE_TRANSLATION_KEYS).includes(name) ? I18n.t(`cookies.${name}`) : name;
  const cookieIsPiwik = name === 'matomo';
  return (
    <div className={cookieIsPiwik ? '' : 'cookie-toggle'}>
      <span className="cookie-title dark-title-3 ellipsis">{cookieName}</span>
      {cookieIsPiwik ? <a
        // if the matomo website is not available in the locale it falls back to english
        href={`${matomoOptOutLink}${locale}`}
        target="_blank"
        rel="noopener noreferrer"
        className="matomo-settings-link"
      >
        <Translate value="cookies.matomoSettings" />
      </a>
        : <SwitchButton
          label={I18n.t('refuse')}
          labelRight={I18n.t('accept')}
          onChange={toggleSwitch}
          checked={!accepted}
          disabled={category === 'essential'}
          name={name}
        />}
    </div>
  );
};

export default CookieToggle;