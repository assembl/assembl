import React from 'react';
import { Translate } from 'react-redux-i18n';
import { withScreenHeight } from './screenDimensions';

class GoUp extends React.Component {
  constructor(props) {
    super(props);
    this.displayButton = this.displayButton.bind(this);
    this.state = { isHidden: true, position: 'fixed' };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.displayButton);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayButton);
  }

  displayButton() {
    const footerHeight = document.getElementById('footer').offsetHeight;
    const { screenHeight } = this.props;
    const threshold = document.body.scrollHeight - screenHeight - footerHeight;
    if (window.pageYOffset > screenHeight && window.pageYOffset < threshold) {
      // Show the button when we scrolled minimum the height of the window.
      this.setState(() => ({ isHidden: false, position: 'fixed' }));
    } else if (window.pageYOffset >= threshold) {
      // At the end of the page, the button stays above the footer.
      // The container needs to have position:relative for it to work.
      this.setState(() => ({ isHidden: false, position: 'absolute' }));
    } else {
      this.setState(() => ({ isHidden: true }));
    }
  }

  render() {
    return (
      <div className={`go-up ${this.state.isHidden ? 'hidden' : ''}`} style={{ position: this.state.position }}>
        <div>
          <a onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>
            <span className="assembl-icon-up-open">&nbsp;</span>
          </a>
        </div>
        <div>
          <Translate value="common.goUp" />
        </div>
      </div>
    );
  }
}

export default withScreenHeight(GoUp);