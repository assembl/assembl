// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';

class Section extends React.Component {
  render() {
    const { title, children } = this.props;
    return (
      <section className="themes-section">
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value={title} />
              </h1>
            </div>
            <div className="content-section">
              {children}
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Section;