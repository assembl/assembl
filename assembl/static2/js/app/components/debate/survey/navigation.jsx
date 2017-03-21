import React from 'react';
import { Grid } from 'react-bootstrap';

class Navigation extends React.Component {
  render() {
    return(
      <section className="navigation-section">
        <Grid fluid>
          <div className="max-container background-color">
            <div className="question-nav">
              Question 1 sur 3
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Navigation;