// @flow
import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';
import type { FictionHeaderType } from '../../../components/debate/brightMirror/fictionHeader';

// import existing storybook data
import { defaultCircleAvatar } from '../../../stories/components/debate/brightMirror/circleAvatar.stories';
import { defaultFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';

const defaultFictionHeader: FictionHeaderType = {
  authorFullname: 'Helen Aguilar',
  publishedDate: new Date('2018-07-09'),
  circleAvatar: { ...defaultCircleAvatar }
};

type BrightMirrorFictionType = {};

class BrightMirrorFiction extends Component<BrightMirrorFictionType> {
  render() {
    return (
      <div className="bright-mirror">
        <Grid fluid className="bright-mirror-fiction background-fiction-default">
          <Row>
            <Col xs={12}>
              <article>
                <FictionHeader {...defaultFictionHeader} />
                <FictionBody {...defaultFictionBody} />
              </article>
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default BrightMirrorFiction;