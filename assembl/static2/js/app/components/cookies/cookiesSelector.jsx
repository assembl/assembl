// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';

const TRANSLATION_KEYS = ['essential', 'analytics'];

type CookiesSelectorProps = {

};

type CookiesSelectorState = {
  activeKey: ?string,
  show: boolean
}

class CookiesSelector extends React.Component<CookiesSelectorProps, CookiesSelectorState> {
  constructor(props: CookiesSelectorProps) {
    super(props);
    this.state = {
      activeKey: null,
      show: false
    };
  }


  render() {
    const { activeKey, show } = this.state;
    return (
      <div className="cookies-selector page-body">
        {TRANSLATION_KEYS.map((key) => {
          const isActiveKey = key === activeKey;
          return (
            <div
              className="cookies-category-selector"
              key={`category-${key}`}
              onClick={() => {
                this.setState({ activeKey: key, show: !show });
                return key !== activeKey && this.setState({ show: true });
              }}
            >
              <span className={classnames('assembl-icon-right-dir', { 'active-arrow': isActiveKey })} />
              <Translate value={`cookiesPolicy.${key}`} />
              {isActiveKey && show &&
              <div className="cookie-title">This is the active categoryV</div>}
            </div>
          );
        })}
      </div>);
  }
}

export default CookiesSelector;