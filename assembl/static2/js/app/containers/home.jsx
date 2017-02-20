import React from 'react';
import Header from '../components/home/header';
import Themes from '../components/home/themes';
import Objectives from '../components/home/objectives';
import Timeline from '../components/home/timeline';
import Video from '../components/home/video';
import Tweet from '../components/home/tweet';
import Partners from '../components/home/partners';

class Home extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Themes />
        <Objectives />
        <Timeline />
        <Video />
        <Tweet />
        <Partners />
      </div>
    );
  }
}

export default Home;