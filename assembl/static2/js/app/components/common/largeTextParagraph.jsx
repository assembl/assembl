import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import Header from './header';

const LargeTextParagraph = ({ debateData, headerTitle, text }) => {
  return (
    <div className="terms-and-conditions">
      <Header title={headerTitle} imgUrl={debateData.headerBackgroundUrl} />
      <Grid fluid>
        <div className="max-container margin-xxl">
          <div className="page-body">
            <div className="ellipsis-content justify">
              {text}
            </div>
          </div>
        </div>
      </Grid>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    debateData: state.debate.debateData
  };
};

export default connect(mapStateToProps)(LargeTextParagraph);