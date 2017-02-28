import React from 'react';
import Header from '../components/home/header';
import Synthesis from '../components/home/synthesis';
import Themes from '../components/home/themes';
import Objectives from '../components/home/objectives';
import Steps from '../components/home/steps';
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
        <Themes />
        <Objectives />
        <Steps />
        <Video />
        <Twitter />
        <Contact />
        <Partners />
      </div>
    );
  }
}

export default Home;