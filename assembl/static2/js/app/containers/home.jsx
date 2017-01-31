import React from 'react';
import { Grid } from 'react-bootstrap';
import Header from '../components/home/header';
import PartnersSection from '../components/home/partnersSection';

class Home extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Grid fluid className="background-grey">
          <div className="max-container" style={{ height: `${400}px`, textAlign: 'center', marginTop: `${50}px` }}>
            Home content
          </div>
        </Grid>
        <PartnersSection />
      </div>
    );
  }
}

export default Home;