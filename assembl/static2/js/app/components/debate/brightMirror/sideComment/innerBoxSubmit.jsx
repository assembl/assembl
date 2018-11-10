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

class InnerBoxSubmit extends React.Component<Props, State> {
  render() {
    const { userId, userName, body, updateBody, submit, cancelSubmit } = this.props;
    // actions props
    const buttons = [
      { id: 'cancel', title: 'debate.confirmDeletionButtonCancel', className: 'button-cancel', onClick: cancelSubmit },
      { id: 'validate', title: 'harvesting.submit', className: 'button-submit', onClick: submit }
    ];
    return (
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
          {buttons.map(button => (
            <Button key={button.id} className={`${button.className} button-dark`} onClick={button.onClick}>
              {I18n.t(button.title)}
            </Button>
          ))}
        </div>
      </div>
    );
  }
}

export default InnerBoxSubmit;