import React from 'react';
import Header from '../components/home/header';
import Themes from '../components/home/themes';
import Objectives from '../components/home/objectives';
import Timeline from '../components/home/timeline';
import Partners from '../components/home/partners';

class Home extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Themes />
        <Objectives />
        <Timeline />
        <Partners />
      </div>
    );
  }
}

export default Home;