// @flow
import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';

// Import existing storybook data
import { defaultFictionHeader } from '../../../stories/components/debate/brightMirror/fictionHeader.stories';
import { defaultFictionToolbar } from '../../../stories/components/debate/brightMirror/fictionToolbar.stories';
import { defaultFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';

const BrightMirrorFiction = () => (
  <div className="bright-mirror">
    <Grid fluid className="bright-mirror-fiction background-fiction-default">
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
);

export default BrightMirrorFiction;