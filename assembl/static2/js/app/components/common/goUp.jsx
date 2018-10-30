// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';

import { withScreenHeight } from './screenDimensions';

type Props = {
  screenHeight: number
};

type State = {
  isHidden: boolean,
  position: string
};

class GoUp extends React.Component<Props, State> {
  state = { isHidden: true, position: 'fixed' };

  componentDidMount() {
    window.addEventListener('scroll', this.displayButton);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayButton);
  }

  displayButton = () => {
    const footer = document.getElementById('footer');
    if (!footer) {
      return;
    }
    const footerHeight = footer.offsetHeight;
    const { screenHeight } = this.props;
    // $FlowFixMe document.body is not null
    const threshold = document.body.scrollHeight - screenHeight - footerHeight;
    if (window.pageYOffset > screenHeight && window.pageYOffset < threshold) {
      // Show the button when we scrolled minimum the height of the window.
      this.setState({ isHidden: false, position: 'fixed' });
    } else if (window.pageYOffset >= threshold) {
      // At the end of the page, the button stays above the footer.
      // The container needs to have position:relative for it to work.
      this.setState({ isHidden: false, position: 'absolute' });
    } else {
      this.setState({ isHidden: true });
    }
  };

  onClick = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  render() {
    const { isHidden, position } = this.state;
    return (
      <div className={classnames('go-up', { hidden: isHidden })} style={{ position: position }}>
        <div>
          <a onClick={this.onClick}>
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