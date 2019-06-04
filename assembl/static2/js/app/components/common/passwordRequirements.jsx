// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';

// this component will be used to fetch the password requirements endpoint
// when it will be developed. Now it is just a default configuration.

const defaultPasswordRequirements = [
  'lengthPassword',
  'figurePassword',
  'upperCasePassword',
  'lowerCasePassword',
  'specialCharacterPassword'
];

const passwordRequirements = () => (
  <React.Fragment>
    <p className="annotation no-margin">{I18n.t('login.passwordRequirementIntro')}</p>
    <ul>
      {defaultPasswordRequirements.map((passwordRequirement, index) => (
        <li key={index} className="annotation no-margin">
          {I18n.t(`login.${passwordRequirement}`)}
        </li>
      ))}
    </ul>
  </React.Fragment>
);

export default passwordRequirements;