// @flow
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { FormGroup, Radio, Checkbox, FormControl } from 'react-bootstrap';

import SectionTitle from './sectionTitle';
import CustomDateRangePicker from './dateRangePicker/customDateRangePicker';
import { datePickerPresets } from '../../constants';
import { getFullDebatePreset } from '../form/utils';

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
  sectionTitle: string,
  phasesPresets: Array<Preset>,
  locale: string
};

type State = {
  exportLink: string
};

export class DumbExportSection extends React.Component<Props, State> {
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

  state = {
    exportLink: ''
  };

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
        <Translate value="administration.export.anonymity" />
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
        <Translate value="administration.export.translation" />
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

  renderDatePicker = () => {
    const { phasesPresets, locale } = this.props;
    const fullDebatePreset = phasesPresets && phasesPresets.length > 0 && getFullDebatePreset(phasesPresets);
    const presets = fullDebatePreset ? [...datePickerPresets, ...phasesPresets, fullDebatePreset] : [...datePickerPresets];
    return presets ? (
      <div className="export-date">
        <Translate value="administration.export.exportDate" />
        <CustomDateRangePicker presets={presets} locale={locale} />
      </div>
    ) : null;
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
          <FormGroup>
            <div className="export-options">
              <div>
                {this.renderAnonymousOption()}
                {this.renderLanguageOptions()}
                {this.renderLinkOptions()}
              </div>
              {this.renderDatePicker()}
            </div>
          </FormGroup>
          <div className="center-flex">
            <Link className="button-link button-dark margin-l" href={this.state.exportLink}>
              <Translate value="administration.export.link" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { phasesById } = state.admin.timeline;
  const filteredPhases = phasesById.sortBy(phase => phase.get('order'));
  const filteredPhasesId = filteredPhases.keySeq().toJS();
  const phasesPresets = filteredPhasesId.map((phaseId, index) => {
    const phase = phasesById.get(phaseId);
    return {
      id: index + 1,
      labelTranslationKey: 'administration.export.presets.phase',
      range: {
        startDate: phase.get('start'),
        endDate: phase.get('end')
      },
      type: 'phase'
    };
  });
  return {
    phasesPresets: phasesPresets,
    locale: state.i18n.locale
  };
};

export default connect(mapStateToProps)(DumbExportSection);