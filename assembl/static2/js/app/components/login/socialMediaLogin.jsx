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

  //TODO: className="`${provider.type}-bg`" on button
  render() {
    return (
      <div>
        <ul>
          {this.props.providers.map( (provider) => {
              return (<li key={provider['name']}>
                <form id={provider.name} method="get" action={ provider.login } >
                  {Object.keys(provider.extra).map( (k) => {
                    <input type="hidden" name={k} value={provider.extra[k]} />
                    })
                  }
                  <button type="submit">{provider.name}</button>
                </form>
              </li>
              );
            })
          }
        </ul>
      </div>
    )
  }
}