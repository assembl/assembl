import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';

// import existing storybook data
import { defaultFictionHeader } from '../../../stories/components/debate/brightMirror/fictionHeader.stories';
import { defaultFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';

class BrightMirrorFiction extends Component {
  render() {
    return (
      <Grid fluid className="bright-mirror background-fiction-default">
        <Row>
          <Col xs={12}>
            <article>
              <FictionHeader {...defaultFictionHeader} />
              <FictionBody {...defaultFictionBody} />
            </article>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default BrightMirrorFiction;