import React from 'react';
import { Translate } from 'react-redux-i18n';

import { scrollToPosition } from '../../utils/globalFunctions';

const MAX_HEIGHT_FOOTER = 400;

class GoUp extends React.Component {
  constructor(props) {
    super(props);
    this.displayButton = this.displayButton.bind(this);
    this.state = { isHidden: true };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.displayButton);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayButton);
  }

  displayButton() {
    if (
      window.pageYOffset > window.innerHeight &&
      window.pageYOffset < document.body.scrollHeight - window.innerHeight - MAX_HEIGHT_FOOTER
    ) {
      this.setState(() => {
        return { isHidden: false };
      });
    } else {
      this.setState(() => {
        return { isHidden: true };
      });
    }
  }

  render() {
    return (
      <div className={`go-up ${this.state.isHidden ? 'hidden' : ''}`}>
        <div>
          <a
            onClick={() => {
              return scrollToPosition(0, 200);
            }}
          >
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

export default GoUp;