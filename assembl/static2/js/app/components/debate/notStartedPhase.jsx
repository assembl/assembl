import React from 'react';
import { Translate, Localize } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';

class Community extends React.Component {
  render() {
    const { startDate } = this.props;
    return (
      <section>
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="content-section center">
              <Translate value="debate.notStarted" />
              <Localize value={startDate} dateFormat="date.format" />
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Community;