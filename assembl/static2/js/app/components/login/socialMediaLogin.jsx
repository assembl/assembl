import React from 'react';
import { form, FormGroup, Button } from 'react-bootstrap';


class SocialMediaItem extends React.Component {
  render(){
    const typeName = this.props.provider['type'];
    const name = this.props.provider['name'];
    const link = this.props.provider['login'];
    <div className={typeName}>
      <a href={link}>{name}</a>
    </div>
  }
}

export class SocialMedia extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return (
      <div>
        <ul>
          {this.props.providers.map( (provider) => {
              return (<li key={provider['type']}>
                <a href={provider['login']}>{provider['name']}</a>
              </li>)
            })
          }
        </ul>
      </div>
    );
	}
}



