import React from 'react';
import { connect } from 'react-redux';

class Chatbot extends React.Component {
  componentDidMount = () => {
    if (!('scriptURL' in this.props.args)) return;
    const { scriptURL, cssURL, args } = this.props.args;
    const addCss = document.createElement('link');
    addCss.setAttribute('rel', 'stylesheet');
    addCss.setAttribute('type', 'text/css');
    addCss.setAttribute('href', cssURL);
    document.body.appendChild(addCss);
    addCss.onload = () => {
      const addScript = document.createElement('script');
      addScript.setAttribute('src', scriptURL);
      document.body.appendChild(addScript);
      addScript.onload = () => {
        window.motionAI_Init(...args); // this function is in the script that just got loaded
      };
    };
  };

  render = () => false;
}

const mapStateToProps = state => ({
  args: state.debate.debateData.motionChatbot
});

export default connect(mapStateToProps)(Chatbot);