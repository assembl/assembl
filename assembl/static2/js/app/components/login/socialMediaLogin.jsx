import React from 'react';
import { form } from 'react-bootstrap';

export class SocialMedia extends React.Component {
  // TODO: Add proper CSS to each social media item
  render() {
    return (
      <div>
        <ul>
          {this.props.providers.map((provider) => {
            return (<li key={provider.name}>
              <form id={provider.name} method="get" action={provider.login} >
                {Object.keys(provider.extra).map((k) => {
                  return (<input key={provider.name + k} type="hidden" name={k} value={provider.extra[k]} />);
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
    );
  }
}