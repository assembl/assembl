// @flow
import React from 'react';
import { Grid, Jumbotron } from 'react-bootstrap';

type Props = {
  title: ?string,
  text: string
};

const MessagePage = ({ title, text }: Props) => (
  <Grid fluid>
    <div className="max-container">
      <Jumbotron>
        {title && <h3 className="dark-title-3">{title}</h3>}
        <div>{text}</div>
      </Jumbotron>
    </div>
  </Grid>
);

export default MessagePage;