// @flow
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { FormGroup, Radio, Checkbox, FormControl } from 'react-bootstrap';

import SectionTitle from './sectionTitle';

type Props = {
  languages?: Array<Object>,
  handleTranslationChange?: (shouldTranslate: boolean) => void,
  handleExportLocaleChange?: (locale: string) => void,
  handleAnonymousChange?: void => void,
  withLanguageOptions: boolean,
  exportLink: string | Array<{ msgId: string, url: string }>,
  exportLocale?: string,
  translate: boolean,
  annotation: string,
  sectionTitle: string
};

type State = {
  exportLink: string
};

class ExportSection extends React.Component<Props, State> {
  static defaultProps = {
    withLanguageOptions: false,
    translate: false,
    annotation: 'defaultAnnotation',
    sectionTitle: 'defaultSectionTitle'
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    const { exportLink } = props;
    return {
      ...state,
      exportLink: typeof exportLink === 'string' ? exportLink : exportLink[0].url
    };
  }

  constructor(props: Props) {
    super(props);
    this.state = { exportLink: '' };
  }

  handleExportLinkChange = (e: SyntheticInputEvent<HTMLInputElement>): void => {
    this.setState({
      exportLink: e.target.value
    });
  };

  renderAnonymousOption = () => {
    const { handleAnonymousChange } = this.props;
    if (!handleAnonymousChange) {
      return null;
    }

    return (
      <React.Fragment>
        <Checkbox onChange={handleAnonymousChange}>
          <Translate value="administration.export.anonymous" />
        </Checkbox>
      </React.Fragment>
    );
  };

  renderLinkOptions = () => {
    const { exportLink } = this.props;
    if (!Array.isArray(exportLink)) {
      return null;
    }

    return (
      <React.Fragment>
        {exportLink.map(option => (
          <Radio
            key={option.msgId}
            checked={this.state.exportLink === option.url}
            name="exportLink"
            value={option.url}
            onChange={this.handleExportLinkChange}
          >
            <Translate value={`administration.export.${option.msgId}`} />
          </Radio>
        ))}
      </React.Fragment>
    );
  };

  renderLanguageOptions = () => {
    const {
      languages,
      handleTranslationChange,
      handleExportLocaleChange,
      withLanguageOptions,
      translate,
      exportLocale
    } = this.props;
    if (!withLanguageOptions || !handleTranslationChange || !handleExportLocaleChange) {
      return null;
    }

    const activeLanguage = languages ? languages.filter(language => language.locale === exportLocale)[0] : null;
    return (
      <React.Fragment>
        <Radio
          checked={!translate}
          onChange={() => {
            handleTranslationChange(false);
          }}
        >
          <Translate value="administration.export.noExportLanguage" />
        </Radio>
        <Radio
          checked={translate}
          onChange={() => {
            handleTranslationChange(true);
          }}
        >
          <Translate value="administration.export.translateTheMessagesIn" />
          {translate && (
            <FormControl
              className="export-language-dropdown"
              componentClass="select"
              onChange={({ target: { value } }) => {
                handleExportLocaleChange(value);
              }}
              value={activeLanguage ? activeLanguage.locale : ''}
            >
              {languages &&
                languages.map(lang => (
                  <option key={`locale-${lang.locale}`} value={lang.locale}>
                    {lang.name}
                  </option>
                ))}
            </FormControl>
          )}
        </Radio>
      </React.Fragment>
    );
  };

  render() {
    const { annotation, sectionTitle } = this.props;
    return (
      <div className="admin-box admin-export-section">
        <SectionTitle
          title={I18n.t(`administration.export.${sectionTitle}`)}
          annotation={I18n.t(`administration.export.${annotation}`)}
        />
        <div className="admin-content">
          <FormGroup className="no-margin-bottom">
            {this.renderAnonymousOption()}
            {this.renderLanguageOptions()}
            {this.renderLinkOptions()}
          </FormGroup>
          <Link className="button-link button-dark margin-s" href={this.state.exportLink}>
            <Translate value="administration.export.link" />
          </Link>
        </div>
      </div>
    );
  }
}

export default ExportSection;