import React from 'react';
import { Grid } from 'react-bootstrap';

class Timeline extends React.Component {
  render() {
    return (
      <Grid fluid>
        <div className="max-container background-grey">
          <div className="timeline" style={{ height: `${200}px` }}>Timeline</div>
        </div>
      </Grid>
    );
  }
}

export default Timeline;