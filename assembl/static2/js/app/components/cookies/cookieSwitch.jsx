// @flow
import * as React from 'react';
import { Translate, I18n } from 'react-redux-i18n';

import SwitchButton from '../common/switchButton';

type Props = {
  cookieIsMatomo: boolean,
  matomoOptOutLink: ?string,
  toggleSwitch: Function,
  accepted: boolean,
  name: string,
  required: boolean
};

const CookieSwitch = ({ cookieIsMatomo, matomoOptOutLink, toggleSwitch, accepted, name, required }: Props) => {
  if (cookieIsMatomo && matomoOptOutLink) {
    return (
      <a
        // if the matomo website is not available in the locale it falls back to english
        href={matomoOptOutLink}
        target="_blank"
        rel="noopener noreferrer"
        className="matomo-settings-link"
      >
        <Translate value="cookies.matomoSettings" />
      </a>
    );
  }

  if (required) {
    return <Translate value="cookies.required" />;
  }

  return (
    <SwitchButton
      label={I18n.t('refuse')}
      labelRight={I18n.t('accept')}
      onChange={toggleSwitch}
      checked={!accepted}
      name={name}
    />
  );
};

export default CookieSwitch;