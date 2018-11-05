// @flow
import React, { Fragment } from 'react';
import { I18n } from 'react-redux-i18n';
import PostBody from '../common/post/postBody';

export type FictionBodyProps = {
  id: string,
  title: string,
  content: string,
  contentLocale: string,
  lang: string
};

const FictionBody = ({ id, title, content, contentLocale, lang }: FictionBodyProps) => (
  <Fragment>
    <h1 className="fiction-title">{title || I18n.t('debate.brightMirror.noTitleSpecified')}</h1>
    <div className="fiction-content">
      <PostBody
        body={content || I18n.t('debate.brightMirror.noContentSpecified')}
        contentLocale={contentLocale}
        id={id}
        lang={lang}
        originalLocale={contentLocale}
        translate={false}
        translationEnabled={false}
        isHarvesting={false}
      />
    </div>
  </Fragment>
);

export default FictionBody;