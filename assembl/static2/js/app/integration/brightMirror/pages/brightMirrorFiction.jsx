// @flow
import React from 'react';
import { Grid, Row, Col, Image } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';
import BackButton, { type Props as BackButtonProps } from '../../../components/debate/common/backButton';
import FictionCommentForm from '../../../components/debate/brightMirror/fictionCommentForm';
import { FictionComment } from '../../../components/debate/brightMirror/fictionComment';

// Import existing storybook data
import { defaultFictionHeader } from '../../../stories/components/debate/brightMirror/fictionHeader.stories';
import { defaultFictionToolbar } from '../../../stories/components/debate/brightMirror/fictionToolbar.stories';
import { defaultFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';
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
    <Grid fluid className="bright-mirror-comment">
      <Row>
        <Col xs={12}>
          <div className="comments-header">
            <h1 className="title center">
              <strong>Prenez la parole !</strong> Quels sujets sont abordés dans cette fiction ?
            </h1>
            <p>
              <Image responsive src="/static2/img/illustration-mechanisme.png" alt="illustration-mechanisme" />
            </p>
            <p className="subtitle center">6 messages</p>
          </div>

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