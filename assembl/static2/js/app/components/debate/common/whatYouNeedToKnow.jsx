import React from 'react';
import { Translate } from 'react-redux-i18n';

export default ({ synthesisTitle }) => (
  <div className="insert-box wyntk-box">
    <h3 className="dark-title-4 wyntk-title">
      <Translate value="debate.whatYouNeedToKnow" />
    </h3>
    <div className="box-hyphen" />
    <div className="wyntk-text-container">
      <p
        className="wyntk-text"
        dangerouslySetInnerHTML={{
          __html: synthesisTitle // TODO: we need to cleanse synthesisTitle before setting HTML content into the <p> tag
        }}
      />
    </div>
  </div>
);