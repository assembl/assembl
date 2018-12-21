// @flow
import React from 'react';

import { Translate, I18n } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

import AvatarImage from '../../../common/avatarImage';
import RichTextEditor from '../../../common/richTextEditor';
import { FICTION_COMMENT_MAX_LENGTH } from '../../../../constants';

export type Props = {
  userId: ?string,
  userName: ?string,
  body: EditorState,
  updateBody: EditorState => void,
  submit: () => void,
  cancelSubmit: () => void
};

const InnerBoxSubmit = ({ userId, userName, body, updateBody, submit, cancelSubmit }: Props) => (
  <div>
    <div className="harvesting-box-header">
      <div className="profile">
        <AvatarImage userId={userId} userName={userName} />
        <div className="harvesting-infos">
          <div className="username">{userName}</div>
          <div className="harvesting-date">
            <Translate value="harvesting.now" />
          </div>
        </div>
      </div>
    </div>
    <div className="harvesting-box-body">
      <div className="submit-comment">
        <RichTextEditor
          editorState={body}
          maxLength={FICTION_COMMENT_MAX_LENGTH}
          onChange={updateBody}
          placeholder={I18n.t('debate.brightMirror.sideComment.commentLabel')}
          withAttachmentButton
        />
      </div>
    </div>
    <div className="harvesting-box-footer">
      <Button key="cancel" className={'button-cancel button-dark'} onClick={cancelSubmit}>
        {I18n.t('debate.confirmDeletionButtonCancel')}
      </Button>
      <Button key="validate" className="button-submit button-dark" onClick={submit}>
        {I18n.t('harvesting.submit')}
      </Button>
    </div>
  </div>
);

export default InnerBoxSubmit;