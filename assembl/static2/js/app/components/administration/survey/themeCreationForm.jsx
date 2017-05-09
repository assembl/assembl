import React from 'react';
import { Button, FormGroup, FormControl } from 'react-bootstrap';

class ThemeCreationForm extends React.Component {
  render() {
    return (
      <div>
        <FormGroup>
          <FormControl type="text" placeholder="Enter text" />
        </FormGroup>
        <FormGroup className="margin-l">
          <FormControl type="file" />
        </FormGroup>
        <div className="plus margin-l">+</div>
        <Button className="button-submit button-dark margin-l">Suivant</Button>
      </div>
    );
  }
}

export default ThemeCreationForm;