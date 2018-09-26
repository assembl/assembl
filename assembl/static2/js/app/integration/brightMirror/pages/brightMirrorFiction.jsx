// @flow
import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';
import BackButton, { type Props as BackButtonProps } from '../../../components/debate/common/backButton';
import FictionCommentHeader from '../../../components/debate/brightMirror/fictionCommentHeader';
import FictionCommentForm from '../../../components/debate/brightMirror/fictionCommentForm';
import { FictionComment } from '../../../components/debate/brightMirror/fictionComment';

// Import existing storybook data
import { defaultFictionHeader } from '../../../stories/components/debate/brightMirror/fictionHeader.stories';
import { defaultFictionToolbar } from '../../../stories/components/debate/brightMirror/fictionToolbar.stories';
import { defaultFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';
import { defaultFictionCommentHeader } from '../../../stories/components/debate/brightMirror/fictionCommentHeader.stories';
import { defaultFictionCommentForm } from '../../../stories/components/debate/brightMirror/fictionCommentForm.stories';
import { defaultFictionComment } from '../../../stories/components/debate/brightMirror/fictionComment.stories';

const defaultBackBtnProps: BackButtonProps = {
  handleClick: Function,
  linkClassName: 'back-btn'
};

const BrightMirrorFiction = () => (
  <div className="bright-mirror">
    <div className="bright-mirror-fiction background-fiction-default">
      <BackButton {...defaultBackBtnProps} />
      <Grid fluid>
        <Row>
          <Col xs={12}>
            <article>
              <FictionHeader {...defaultFictionHeader} />
              <FictionToolbar {...defaultFictionToolbar} />
              <FictionBody {...defaultFictionBody} />
            </article>
          </Col>
        </Row>
      </Grid>
    </div>
    <Grid fluid className="bright-mirror-comments background-comments-default">
      <Row>
        <Col xs={12}>
          <FictionCommentHeader {...defaultFictionCommentHeader} />
          <div className="comments-content">
            <FictionCommentForm {...defaultFictionCommentForm} />
            <FictionComment {...defaultFictionComment} />
            <FictionComment {...defaultFictionComment} />
            <FictionComment {...defaultFictionComment} />
            <FictionComment {...defaultFictionComment} />
            <FictionComment {...defaultFictionComment} />
            <FictionComment {...defaultFictionComment} />
          </div>
        </Col>
      </Row>
    </Grid>
  </div>
);

export default BrightMirrorFiction;