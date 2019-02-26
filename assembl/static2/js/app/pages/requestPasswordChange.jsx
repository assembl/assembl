// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
// Route helper import
import { browserHistory } from '../../app/router';

import { requestPasswordChangeAction } from '../actions/authenticationActions';
import RequestNewPasswordForm from '../components/login/requestNewPasswordForm';
import SendPwdConfirm from '../components/login/sendPwdConfirm';
import BackButton from '../components/debate/common/backButton';

export type ChangePasswordResponse = {
  data: Array<any>,
  success: boolean | null
};

type Props = {
  passwordChangeResponse: ChangePasswordResponse,
  requestPasswordChange: (string, string) => void
};

export class DumbRequestPasswordChange extends React.Component<Props> {
  render() {
    const { passwordChangeResponse, requestPasswordChange } = this.props;

    const redirectToPreviousPage = () => {
      browserHistory.goBack();
    };

    return (
      <Grid fluid className="login-container">
        <Row className="max-container">
          <Col xs={12} md={6} className="col-centered">
            <BackButton handleClick={redirectToPreviousPage} linkClassName="back-btn" />
            {passwordChangeResponse.success ? (
              <SendPwdConfirm />
            ) : (
              <RequestNewPasswordForm
                passwordChangeResponse={passwordChangeResponse}
                requestPasswordChange={requestPasswordChange}
              />
            )}
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = ({ auth }) => ({
  passwordChangeResponse: auth.passwordChangeRequest
});

const mapDispatchToProps = dispatch => ({
  requestPasswordChange: (id, discussionSlug) => dispatch(requestPasswordChangeAction(id, discussionSlug))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbRequestPasswordChange);