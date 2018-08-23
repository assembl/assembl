import React, { Component } from 'react';
import CircleAvatar from '../../../components/debate/brightMirror/circleAvatar';

class BrightMirrorFiction extends Component {
  render() {
    return (
      <ul>
        <li>
          <ul>
            <li><CircleAvatar src="https://loremflickr.com/300/300" /></li>
            <li>First name and last name of the creator</li>
            <li>Creation date</li>
          </ul>
        </li>
        <li>
          <ul>
            <li>The title of the fiction</li>
            <li>The content of the fiction</li>
          </ul>
        </li>
      </ul>
    );
  }
}

export default BrightMirrorFiction;