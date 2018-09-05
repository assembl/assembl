// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import classnames from 'classnames';
import CookieSetter from './cookieSetter';
import type { CookiesObject } from './cookiesSelectorContainer';

type CookiesSelectorProps = {
  activeKey: ?string,
  show: boolean,
  cookies: ?CookiesObject,
  handleCategorySelection: Function,
  handleSave: Function,
  handleToggle: Function,
  toggleCookieType: Function,
  locale: string,
  settingsHaveChanged: boolean
};

const CookiesSelector = ({
  activeKey,
  show,
  cookies,
  handleCategorySelection,
  handleSave,
  handleToggle,
  toggleCookieType,
  locale,
  settingsHaveChanged
}: CookiesSelectorProps) => (
  <div className="cookies-selector">
    <h2 className="dark-title-2">
      <Translate value="profile.cookies" />
    </h2>
    <Translate value="cookiesPolicy.instructions" className="cookies-instructions" />
    <div className="cookies-categories">
      {cookies &&
          Object.keys(cookies).map((category) => {
            const isActiveKey = category === activeKey;
            return (
              <div key={category}>
                <div
                  className="cookies-category-selector"
                  onClick={() => {
                    handleCategorySelection(category);
                  }}
                >
                  <span className={classnames('assembl-icon-right-dir', { 'active-arrow': isActiveKey })} />
                  <Translate value={`cookiesPolicy.${category}`} className="dark-title-3" />
                </div>
                <div className="cookies-toggles">
                  {isActiveKey &&
                    show &&
                    cookies[category] &&
                    cookies[category].map(cookie => (
                      <CookieSetter
                        cookie={cookie}
                        key={cookie.name}
                        handleToggle={handleToggle}
                        toggleCookieType={toggleCookieType}
                        locale={locale}
                      />
                    ))}
                </div>
              </div>
            );
          })}
    </div>
    <div className="submit-button-container">
      <Button onClick={handleSave} className={settingsHaveChanged ? 'button-submit button-dark' : 'hidden'}>
        <Translate value="profile.save" />
      </Button>
    </div>
  </div>
);

export default CookiesSelector;