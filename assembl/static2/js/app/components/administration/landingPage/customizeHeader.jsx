// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';

import SectionTitle from '../../administration/sectionTitle';

class CustomizeHeader extends React.Component<void, void, void> {
  render() {
    return (
      <div className="admin-box">
        <SectionTitle
          title={I18n.t('administration.landingPage.header.title')}
          annotation={I18n.t('administration.annotation')}
        />
        <div className="admin-content form-container">
          <p className="admin-paragraph">
            <Translate value="administration.landingPage.header.helper" />
          </p>
        </div>
      </div>
    );
  }
}

export default CustomizeHeader;