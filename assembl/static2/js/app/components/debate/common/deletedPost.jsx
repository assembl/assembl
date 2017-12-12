// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';

type DeletedByType = 'user' | 'admin';

type DeletedPostProps = {
  id: string,
  subject: React.Element<*>,
  deletedBy: DeletedByType
};

const DeletedPost = ({ id, subject, deletedBy }: DeletedPostProps): React.Element<*> => (
  <div className="posts deleted-post" id={id}>
    <div className="box">
      <Row className="post-row">
        <Col xs={12} md={12} className="post-left">
          <h3 className="dark-title-3">{subject}</h3>
          <div className="body">
            <Translate value={deletedBy === 'user' ? 'debate.thread.postDeletedByUser' : 'debate.thread.postDeletedByAdmin'} />
          </div>
        </Col>
      </Row>
    </div>
  </div>
);

export default DeletedPost;