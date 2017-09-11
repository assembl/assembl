// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import SwitchButton from 'react-switch-button';
import 'react-switch-button/dist/react-switch-button.css';

const PostTranslate = ({
  id,
  originalBodyLocale,
  showOriginal,
  toggle
}: {
  id: string,
  originalBodyLocale: string,
  showOriginal: boolean,
  toggle: Function
}) => {
  return (
    <div className="translate">
      {!showOriginal
        ? <p>
          <Translate value="debate.thread.messageTranslatedFrom" language={I18n.t(`language.${originalBodyLocale}`)} />
        </p>
        : null}
      <SwitchButton
        name={`switch-${id}`}
        onChange={toggle}
        defaultChecked={showOriginal}
        // labelRight={showOriginal ? I18n.t('debate.thread.translate') : I18n.t('debate.thread.showOriginal')}
        labelRight={I18n.t('debate.thread.showOriginal')}
      />
    </div>
  );
};

export default PostTranslate;