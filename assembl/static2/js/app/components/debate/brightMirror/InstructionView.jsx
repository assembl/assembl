import React from 'react';

import { Col } from 'react-bootstrap';
import activeHtml from 'react-active-html';
import { postBodyReplacementComponents } from '../common/post/postBody';


const InstructionView = ({ announcementContent }) => (
  <div className="announcement">
    <div className="announcement-title">
      <div className="title-hyphen">&nbsp;</div>
      <h3 className="announcement-title-text dark-title-1">
        { announcementContent.title }
      </h3>
    </div>
    <Col xs={12} md={8} className="announcement-media col-md-push-4">
      <div>{ activeHtml(announcementContent.body, postBodyReplacementComponents()) }</div>
    </Col>
  </div>
);

export default InstructionView;