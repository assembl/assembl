import React from 'react';
import { graphql } from 'react-apollo';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';

export class MainDiscussion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      subject: this.props.disccussionSubject,
      body: this.props.disccussionBody,
      isActive: false
    };

    this.toggleMainDiscussion = this.toggleMainDiscussion.bind(this);
    this.postNewDiscussion = this.postNewDiscussion.bind(this);
    this.cancelNewDiscussion = this.cancelNewDiscussion.bind(this);
  }

  toggleMainDiscussion() {
    this.setState({ isActive: !this.state.isActive });
  }

  postNewDiscussion(e) {
    e.preventDefault();

    const variables = {
      ideaId: this.props.ideaId,
      subject: this.subject.value,
      body: this.body.value
    };

    // TODO: dispatch action to Post with GraphQL and perform a global redux state update
    this.props.createPost({ variables: variables })
      .then(() => {
        this.setState({
          subject: undefined,
          body: undefined,
          isActive: false
        });
      });
  }

  cancelNewDiscussion() {
    this.toggleMainDiscussion();
    this.setState({ subject: undefined, body: undefined });
  }

  render() {
    const buttonStyleHack = { color: 'black' };
    return (
      <div>
        <h3 className="dark-title-3">
          Je démarre<br />
          une discussion
        </h3>

        <div className="box-hyphen" />
        <div className="form-container">
          <form>
            <div className="form-group">
              <input
                type="text"
                id="post-subject"
                className="form-control"
                placeholder="Sujet"
                value={this.state.subject}
                ref={(subject) => { this.subject = subject; }}
                onFocus={() => { this.setState({ isActive: true }); }}
              />
              {
                  this.state.isActive &&
                  <textarea
                    id="post-body"
                    className="form-control"
                    placeholder="insérez du contenu.."
                    value={this.state.body}
                    ref={(body) => { this.body = body; }}
                  />
                }
            </div>

            {
                this.state.isActive &&
                <div className="btn-group">
                  <button
                    type="reset" style={buttonStyleHack} // TODO: put style outside (e.g on stylesheet)
                    className="button-cancel button-light btn btn-default"
                    onClick={this.cancelNewDiscussion}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit" style={buttonStyleHack} // TODO: put style outside (e.g on stylesheet)
                    className="button-submit button-light btn btn-default"
                    onClick={(e) => { this.postNewDiscussion(e); }}
                  >
                    Poster
                  </button>
                </div>
              }
          </form>
        </div>
      </div>
    );
  }
}

export default graphql(createPostMutation, { name: 'createPost' })(MainDiscussion);