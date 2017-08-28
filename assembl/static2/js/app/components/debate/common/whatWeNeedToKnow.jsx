import React from 'react';
import { Translate } from 'react-redux-i18n';

export default ({ longTitle }) => {
  return (
    <div className="insert-box wwntk-box">
      <h3 className="dark-title-3 wwntk-title">
        <Translate value="debate.whatWeNeedToKnow" />
      </h3>
      <div className="box-hyphen" />
      <p className="wwntk-text" dangerouslySetInnerHTML={{ __html: longTitle }} />
    </div>
  );
};