import React from 'react';
import { Translate } from 'react-redux-i18n';

export default ({ longTitle }) => {
  return (
    <div className="insert-box wyntk-box">
      <h3 className="dark-title-3 wyntk-title">
        <Translate value="debate.whatYouNeedToKnow" />
      </h3>
      <div className="box-hyphen" />
      <p className="wyntk-text" dangerouslySetInnerHTML={{ __html: longTitle }} />
    </div>
  );
};