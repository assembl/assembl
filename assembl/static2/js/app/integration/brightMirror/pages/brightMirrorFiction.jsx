// @flow
import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';
import BackButton from '../../../components/debate/common/backButton';

// Import existing storybook data
import { defaultFictionHeader } from '../../../stories/components/debate/brightMirror/fictionHeader.stories';
import { defaultFictionToolbar } from '../../../stories/components/debate/brightMirror/fictionToolbar.stories';
import { defaultFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';

const BrightMirrorFiction = () => (
  <div className="bright-mirror">
    <div className="bright-mirror-fiction background-fiction-default">
      <BackButton handleClick={() => {}} linkClassName="back-btn" />
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
  </div>
);

export default BrightMirrorFiction;