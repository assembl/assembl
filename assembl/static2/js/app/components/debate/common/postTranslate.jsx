// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import SwitchButton from '../../common/switchButton';

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
      <p>
        <Translate
          value={!showOriginal ? 'debate.thread.messageTranslatedFrom' : 'debate.thread.messageOriginallyIn'}
          language={I18n.t(`language.${originalBodyLocale}`)}
        />
      </p>
      <SwitchButton
        name={`switch-${id}`}
        onChange={toggle}
        defaultChecked={showOriginal}
        labelRight={I18n.t('debate.thread.showOriginal')}
      />
    </div>
  );
};

export default PostTranslate;