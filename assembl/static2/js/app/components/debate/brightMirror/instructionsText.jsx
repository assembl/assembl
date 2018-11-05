// @flow
import React from 'react';
import { Col, Grid } from 'react-bootstrap';
import { transformLinksInHtml /* getUrls */ } from '../../../utils/linkify';
import { Html, postBodyReplacementComponents } from '../common/post/postBody';

export type InstructionsTextProps = {
  title: string,
  body: string
};

const InstructionsText = ({ title, body }: InstructionsTextProps) => (
  <Grid fluid className="background-light instructions-text">
    <div className="max-container">
      <div className="content-section">
        <div className="announcement">
          <div className="announcement-title">
            <div className="title-hyphen">&nbsp;</div>
            <h3 className="announcement-title-text dark-title-1">{title}</h3>
          </div>
          <Col xs={12} md={8} className="announcement-media col-md-push-2">
            <Html rawHtml={transformLinksInHtml(body)} replacementComponents={postBodyReplacementComponents()} />
          </Col>
        </div>
      </div>
    </div>
  </Grid>
);

export default InstructionsText;