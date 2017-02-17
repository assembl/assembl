import React from 'react';
import Header from '../components/home/header';
import Themes from '../components/home/themes';
import Partners from '../components/home/partners';

class Home extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Themes />
        <Partners />
      </div>
    );
  }
}

export default Home;