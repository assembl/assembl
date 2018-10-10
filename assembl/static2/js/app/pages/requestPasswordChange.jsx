// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';

import { requestPasswordChangeAction } from '../actions/authenticationActions';
import SendPwdForm from '../components/login/sendPwdForm';
import SendPwdConfirm from '../components/login/sendPwdConfirm';

export type ChangePasswordResponse = {
  data: Array<any>,
  success: boolean | null
};

type Props = {
  passwordChangeResponse: ChangePasswordResponse,
  requestPasswordChange: (string, string) => void
};

class RequestPasswordChange extends React.Component<Props> {
  render() {
    const { passwordChangeResponse, requestPasswordChange } = this.props;
    return (
      <Grid fluid className="login-container">
        <Row className="max-container center">
          <Col xs={12} md={6} className="col-centered">
            {passwordChangeResponse.success ? (
              <SendPwdConfirm />
            ) : (
              <SendPwdForm passwordChangeResponse={passwordChangeResponse} requestPasswordChange={requestPasswordChange} />
            )}
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  passwordChangeResponse: state.auth.passwordChangeRequest
});

const mapDispatchToProps = dispatch => ({
  requestPasswordChange: (id, discussionSlug) => dispatch(requestPasswordChangeAction(id, discussionSlug))
});

export default connect(mapStateToProps, mapDispatchToProps)(RequestPasswordChange);