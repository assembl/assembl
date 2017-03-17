import React from 'react';
import Header from '../components/home/header';
import Synthesis from '../components/home/synthesis';
import Objectives from '../components/home/objectives';
import Phases from '../components/home/phases';
import Video from '../components/home/video';
import Twitter from '../components/home/twitter';
import Contact from '../components/home/contact';
import Partners from '../components/home/partners';

class Home extends React.Component {
  render() {
    return (
      <div className="home">
        <Header />
        <Synthesis />
        <Objectives />
        <Phases />
        <Video />
        <Twitter />
        <Contact />
        <Partners />
      </div>
    );
  }
}

export default Home;