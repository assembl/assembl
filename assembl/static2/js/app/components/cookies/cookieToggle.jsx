// @flow
/* global globalAnalytics */
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';

// Components
import SwitchButton from '../common/switchButton';
import Helper from '../common/helper';

import { COOKIE_TRANSLATION_KEYS } from '../../constants';

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

// @$FlowFixMe globalAnalytics is a global variable
const matomoHost = globalAnalytics.piwik ? globalAnalytics.piwik.host : null;

const CookieToggle = ({ handleToggle, cookie, toggleCookieType, locale }: CookieToggleProps) => {
  const toggleSwitch = () => {
    const { accepted, cookieType } = cookie;
    const updatedCookie = { ...cookie, accepted: !accepted, cookieType: toggleCookieType(cookieType) };
    handleToggle(updatedCookie);
  };

  const { name, category, accepted } = cookie;

  const cookieName = Object.keys(COOKIE_TRANSLATION_KEYS).includes(name) ? I18n.t(`cookies.${name}`) : name;
  const cookieIsPiwik = name === 'matomo';
  const matomoOptOutLink = matomoHost ?
    `https://${matomoHost}/index.php?module=CoreAdminHome&action=optOut&language=${locale}`
    : null;
  return (
    <div className={cookieIsPiwik && matomoOptOutLink ? '' : 'cookie-toggle'}>
      <div className="cookie-title">
        <span className="dark-title-3 ellipsis">{cookieName}</span>
        <Helper
          helperText={I18n.t(`cookies.${name}Helper`)}
          classname="cookie-helper"
        />
      </div>
      {cookieIsPiwik && matomoOptOutLink ? <a
        // if the matomo website is not available in the locale it falls back to english
        href={matomoOptOutLink}
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