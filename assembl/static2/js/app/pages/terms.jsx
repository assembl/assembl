import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import Header from '../components/common/header';

class Terms extends React.Component {
  render() {
    const { debateData } = this.props;
    const termsAndConditions =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut volutpat interdum sem, eget malesuada tortor gravida volutpat. Donec luctus semper tincidunt. Sed vel iaculis libero, eu volutpat ante. Nullam lobortis suscipit lorem, a posuere erat vulputate sed. Integer varius purus diam, nec scelerisque urna vehicula et.';
    return (
      <div className="terms-and-conditions">
        <Header title={I18n.t('terms.panelTitle')} imgUrl={debateData.headerBackgroundUrl} />
        <Grid fluid>
          <div className="max-container margin-xxl">
            <div className="page-body">
              <div className="ellipsis-content justify">
                {termsAndConditions}
              </div>
            </div>
          </div>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debateData: state.debate.debateData
  };
};

export default connect(mapStateToProps)(Terms);