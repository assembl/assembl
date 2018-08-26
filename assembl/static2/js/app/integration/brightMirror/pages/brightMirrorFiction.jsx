import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import FictionHeader from '../../../components/debate/brightMirror/fictionHeader';
import FictionBody from '../../../components/debate/brightMirror/fictionBody';

// import existing storybook data
import { customFictionHeader } from '../../../stories/components/debate/brightMirror/fictionHeader.stories';
import { customFictionBody } from '../../../stories/components/debate/brightMirror/fictionBody.stories';

class BrightMirrorFiction extends Component {
  render() {
    return (
      <Grid fluid className="bright-mirror background-fiction-default">
        <Row>
          <Col xs={12}>
            <article>
              <FictionHeader {...customFictionHeader} />
              <FictionBody {...customFictionBody} />
            </article>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default BrightMirrorFiction;