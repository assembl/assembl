// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';

const PostTranslate = ({
  originalBodyLocale,
  showOriginal,
  toggle
}: {
  originalBodyLocale: string,
  showOriginal: boolean,
  toggle: Function
}) => {
  return (
    <p>
      {!showOriginal
        ? <Translate value="debate.thread.messageTranslatedFrom" language={I18n.t(`language.${originalBodyLocale}`)} />
        : null}
      <button onClick={toggle}>
        {showOriginal ? <Translate value="debate.thread.translate" /> : <Translate value="debate.thread.showOriginal" />}
      </button>
    </p>
  );
};

export default PostTranslate;