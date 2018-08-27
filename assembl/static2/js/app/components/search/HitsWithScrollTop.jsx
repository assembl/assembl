// @flow
import React from 'react';
import { Hits } from 'searchkit';

type Props = {};

export default class HitsWithScrollTop extends React.Component<Props> {
  componentDidUpdate() {
    // scroll to top when clicking on pagination
    setTimeout(() => {
      const div = document.querySelector('.sk-hits-list');
      if (div) {
        div.scrollTop = 0;
      }
    }, 200); // wait 200ms for the results to come back to feel less weird
  }

  render() {
    return <Hits {...this.props} />;
  }
}