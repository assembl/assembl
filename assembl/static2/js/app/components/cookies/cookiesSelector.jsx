// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';
import CookieSetter from './cookieSetter';
import type { CookiesObject } from './cookiesSelectorContainer';
import { moveElementToFirstPosition } from '../../utils/globalFunctions';

type CookiesSelectorState = {
  selectedCategory: ?string
};

type CookiesSelectorProps = {
  cookies: ?CookiesObject,
  handleSave: Function,
  handleToggle: Function,
  toggleCookieType: Function,
  locale: string,
  settingsHaveChanged: boolean
};

class CookiesSelector extends React.PureComponent<CookiesSelectorProps, CookiesSelectorState> {
  state = {
    selectedCategory: null
  };

  toggleCategory = (category: ?string) => {
    this.setState((prevState) => {
      const newSelection = prevState.selectedCategory !== category ? category : null;
      return {
        selectedCategory: newSelection
      };
    });
  };

  render() {
    const { cookies, handleSave, handleToggle, toggleCookieType, locale, settingsHaveChanged } = this.props;
    const { selectedCategory } = this.state;
    // putting 'essential' as the first element of the array
    const categoriesArray = cookies && moveElementToFirstPosition(Object.keys(cookies), 'essential');
    return (
      <div className="cookies-selector">
        <h2 className="dark-title-2">
          <Translate value="profile.cookies" />
        </h2>
        <Translate value="cookiesPolicy.instructions" className="cookies-instructions" />
        <div className="cookies-categories">
          {categoriesArray &&
            categoriesArray.map(category => (
              <div key={category}>
                <div className="cookies-category-selector" onClick={() => this.toggleCategory(category)}>
                  <span
                    className={classNames({
                      'assembl-icon-angle-down': selectedCategory === category,
                      'assembl-icon-angle-right': selectedCategory !== category
                    })}
                  />
                  <Translate value={`cookiesPolicy.${category}`} className="dark-title-3" />
                </div>
                <div className="cookies-toggles">
                  {selectedCategory === category &&
                    cookies &&
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
            ))}
        </div>
        <div className="submit-button-container">
          <Button onClick={handleSave} className={settingsHaveChanged ? 'button-submit button-dark' : 'hidden'}>
            <Translate value="profile.save" />
          </Button>
        </div>
      </div>
    );
  }
}

export default CookiesSelector;