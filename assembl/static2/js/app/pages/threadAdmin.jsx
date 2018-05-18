import React from 'react';
import ExportSection from '../components/administration/exportSection';
import { get } from '../utils/routeMap';

class ThreadAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      exportLocale: null,
      refetching: false,
      translate: false
    };
  }

  handleExportLocaleChange = (locale) => {
    this.setState({ exportLocale: locale });
  };

  render() {
    const { section, languages, debateId } = this.props;
    const { translate } = this.state;
    const exportLocale = this.state.exportLocale || (languages && languages[0].locale);
    const translation = translate && exportLocale ? `?lang=${exportLocale}` : '?'; // FIXME: using '' instead of '?' does not work
    const exportLink = get('exportThreadMulticolumnData', { debateId: debateId, translation: translation });
    return (
      <div className="thread-admin">
        {section === '1' && (
          // When the other sections of this admin will be added, this one will be the last section and not '1'
          <ExportSection
            withLanguageOptions
            handleExportLocaleChange={this.handleExportLocaleChange}
            handleTranslationChange={this.handleTranslationChange}
            exportLink={exportLink}
            translate={translate}
            exportLocale={exportLocale}
            languages={languages}
            annotation="threadAnnotation"
          />
        )}
      )
      </div>
    );
  }
}

export default ThreadAdmin;