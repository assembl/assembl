// @flow
// TODO: refactor this component into a container and presentation component
import * as React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import moment from 'moment';
import { Link } from 'react-router';
import { FormGroup, Radio, Checkbox, FormControl } from 'react-bootstrap';
import { get } from '../../utils/routeMap';
import DiscussionPreferences from '../../graphql/DiscussionPreferences.graphql';

import SectionTitle from './sectionTitle';
import CustomDateRangePicker from './dateRangePicker/customDateRangePicker';
import { datePickerPresets } from '../../constants';
import { getFullDebatePreset } from '../form/utils';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import { getDiscussionId } from '../../utils/globalFunctions';

type Props = {
  languages?: Array<Object>,
  exportLink: string | Array<{ msgId: string, url: string }>,
  annotation: string,
  sectionTitle: string,
  phasesPresets: Array<Preset>,
  locale: string
};

type State = {
  shoudTranslate: boolean,
  exportLocale: string,
  shouldBeAnonymous: boolean
};

export class DumbExportSection extends React.Component<Props, State> {
  static defaultProps = {
    annotation: 'defaultAnnotation',
    sectionTitle: 'defaultSectionTitle'
  };

  state = {
    exportLocale: '',
    shouldTranslate: false,
    shouldBeAnonymous: false
  };

  handleExportLinkChange = (e: SyntheticInputEvent<HTMLInputElement>): void => {
    this.setState({
      exportLink: e.target.value
    });
  };

  renderAnonymousOption = () => {
    const toggleAnonymousOption = () => {
      this.setState(prevState => ({ shouldBeAnonymous: !prevState.shouldBeAnonymous }));
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
    const { languages } = this.props;
    const { shouldTranslate, exportLocale } = this.state;

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
    const { annotation, sectionTitle, languages } = this.props;
    const { shouldTranslate, shouldBeAnonymous, exportLocale } = this.state;
    const locale = exportLocale || (languages && languages[0].locale);
    const translation = shouldTranslate && locale ? `?lang=${locale}` : '';
    const anonymous = `&anon=${shouldBeAnonymous.toString()}`;
    const debateId = getDiscussionId();
    const exportLink = get(
      'exportDebateData',
      { debateId: debateId },
      { translation: translation, anonymous: anonymous, startDate: '2019-04-01', endDate: '2019-04-02' }
    );
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
            <Link className="button-link button-dark margin-l" href={exportLink}>
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