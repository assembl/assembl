// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';

type DeletedByType = 'user' | 'admin';

type DeletedPostProps = {
  id: string,
  deletedBy: DeletedByType
};

const DeletedPost = ({ id, deletedBy }: DeletedPostProps): React.Element<any> => (
  <div className="posts deleted-post" id={id}>
    <div className="box">
      <Row className="post-row">
        <Col xs={12} md={12} className="post-left">
          <h3 className="dark-title-3">
            <Translate value="debate.thread.postDeleted" />
          </h3>
          <div className="body">
            <Translate value={deletedBy === 'user' ? 'debate.thread.postDeletedByUser' : 'debate.thread.postDeletedByAdmin'} />
          </div>
        </Col>
      </Row>
    </div>
  </div>
);

export default DeletedPost;