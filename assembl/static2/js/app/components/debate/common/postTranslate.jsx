// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import SwitchButton from 'react-switch-button';
import 'react-switch-button/dist/react-switch-button.css';

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
    <div>
      {!showOriginal
        ? <Translate value="debate.thread.messageTranslatedFrom" language={I18n.t(`language.${originalBodyLocale}`)} />
        : null}
      <SwitchButton
        onChange={toggle}
        defaultChecked={showOriginal}
        // labelRight={showOriginal ? I18n.t('debate.thread.translate') : I18n.t('debate.thread.showOriginal')}
        labelRight={I18n.t('debate.thread.showOriginal')}
      />
    </div>
  );
};

export default PostTranslate;