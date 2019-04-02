// @flow
// TODO: refactor this component into a container and presentation component
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import moment from 'moment';
import { Link } from 'react-router';
import { FormGroup, Radio, Checkbox, FormControl } from 'react-bootstrap';
import DiscussionPreferences from '../../graphql/DiscussionPreferences.graphql';

import SectionTitle from './sectionTitle';
import CustomDateRangePicker from './dateRangePicker/customDateRangePicker';
import { datePickerPresets } from '../../constants';
import { getFullDebatePreset } from '../form/utils';
import manageErrorAndLoading from '../common/manageErrorAndLoading';

type Props = {
  languages?: Array<Object>,
  exportLink: string | Array<{ msgId: string, url: string }>,
  exportLocale?: string,
  annotation: string,
  sectionTitle: string,
  phasesPresets: Array<Preset>,
  locale: string
};

type State = {
  exportLink: string,
  shoudTranslate: boolean,
  exportLocale: string
};

export class DumbExportSection extends React.Component<Props, State> {
  static defaultProps = {
    annotation: 'defaultAnnotation',
    sectionTitle: 'defaultSectionTitle'
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    const exportLink = ''; // TODO: add get function with proper parameters
    return {
      ...state,
      exportLink: typeof exportLink === 'string' ? exportLink : exportLink[0].url
    };
  }

  state = {
    exportLink: '',
    exportLocale: '',
    shouldTranslate: false
  };

  handleExportLinkChange = (e: SyntheticInputEvent<HTMLInputElement>): void => {
    this.setState({
      exportLink: e.target.value
    });
  };

  renderAnonymousOption = () => {
    const toggleAnonymousOption = () => {
      this.setState(prevState => ({ shouldBeAnonymous: !prevState.isAnonymous }));
    };
    return (
      <React.Fragment>
        <Translate value="administration.export.anonymity" />
        <Checkbox onChange={toggleAnonymousOption} value={this.state.shouldBeAnonymous}>
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
    const { languages, exportLocale } = this.props;
    const { shouldTranslate } = this.state;

    const activeLanguage = languages ? languages.filter(language => language.locale === exportLocale)[0] : null;

    return (
      <React.Fragment>
        <Translate value="administration.export.translation" />
        <Radio
          checked={!shouldTranslate}
          onChange={() => {
            this.setState({ shouldTranslate: false });
          }}
        >
          <Translate value="administration.export.noExportLanguage" />
        </Radio>
        <Radio
          checked={shouldTranslate}
          onChange={() => {
            this.setState({ shouldTranslate: true });
          }}
        >
          <Translate value="administration.export.translateTheMessagesIn" />
          {shouldTranslate && (
            <FormControl
              className="export-language-dropdown"
              componentClass="select"
              onChange={(e) => {
                this.setState({ exportLocale: e.target.value });
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
  const phases = state.timeline;
  const phasesPresets = phases
    ? phases.map((phase, index) => ({
      id: index + 1,
      labelTranslationKey: 'administration.export.presets.phase',
      range: {
        startDate: moment(phase.start),
        endDate: moment(phase.end)
      },
      type: 'phase'
    }))
    : [];
  return {
    phasesPresets: phasesPresets,
    locale: state.i18n.locale
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionPreferences, {
    options: ({ locale }) => ({
      variables: {
        inLocale: locale
      }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        languages: data.discussionPreferences.languages
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbExportSection);