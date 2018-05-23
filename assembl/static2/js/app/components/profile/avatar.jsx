// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';

type AvatarProps = {
  creationDate: ?string,
  name: string,
  lang: string
};

const Avatar = ({ creationDate, lang, name }: AvatarProps) => (
  <div>
    <div className="center">
      <span className="assembl-icon-profil" />
    </div>
    <h2 className="dark-title-2 capitalized center">{name}</h2>
    {creationDate && (
      <div className={`center member-since lang-${lang}`}>
        <Translate value="profile.memberSince" date={I18n.l(creationDate, { dateFormat: 'date.format2' })} />
      </div>
    )}
  </div>
);

export default Avatar;