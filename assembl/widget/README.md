# Widgets

DRAFT DOCUMENT.
This corresponds to desired implementation, not necessarily to current implementation.

The widget architecture is meant to be as lightweight as possible.
The shared knowledge between the platform and the widget should be kept to a minimum.
Still, there is some shared knowledge. Here are a few points, with notes on Assembl implantation.

## Widget lifecycle

All Widgets should have a `widget_url`, that represents Widget information, including its `settings`, readable as JSON.
It should also get the current user, its permissions, the current discussion, and various enpoints that it needs.
The settings information SHOULD contain an endpoint for storing (PUTting) the `widget_state` and `user_state` as a JSON blobs. 
(Benoitg:  Unclear:  can we or can't we put for example the "user_state" by PUTing on widget_url 
(It is possible to GET those blobs separately; but if they exist they will always be given as part of the `widget_url` json to save on calls.)
The state and user_state URLs are public. Protected information (eg widget lifecycle phase) can be PUT again in the settings property of the `widget_url`.

(Note: The `settings` are a property of the JSON blob obtained at `widget_url`, not the blob itself. This allows to have discussion, user, etc. as siblings to the `settings`. PUTting on the widget_url is an update operation, not a full replace: Only specified elements will be replaced. In particular, the `settings` count as a single element; it is replaced as a whole, but the PUT needs not repeat the type info etc.)

There are many lifecycle options. 

### Creativity session lifecycle

1. Discussion admin creates a creativity session Widget configuration on an idea.  This includes setting cards, session root idea, etc.
2. User clicks on a URL (inside the session's root idea panel) including the `widget_state`
3. Widget uses `widget_state`, `user_state` and api points.

### Inspire me lifecycle

1. Discussion admin creates a Inspire me Widget configuration, setting cards deck, you tube option, etc.
2. User clicks on a URL (based in any idea panel) including the `widget_state` and idea ID as a GET argument.
3. Widget stores idea ID in `user_state` and proceeds from there.

The widget may also store the user's interaction with that specific idea in the user_state.
It should then keep a "latest idea" reference in the user_state. 
(benoitg: what for? it has the reference in the url)

### Voting lifecycle

1. Discussion admin creates a voting session configuration. This will include a set of ideas to be voted on, and a set of criteria ideas to use.
Eventually, we will use idea subtypes, but implementation 0 will probably be for criteria to be the children of a given idea, and likewise for the voting targets.
(benoitg:  I think we should always tie our voting session on a single idea, OR enumerate all options and criterias explicitely, but not support both­.  I think the second makes more sense for assembl-independent implementations, ans saves an awfull lot of gets.  In that case, we could pass the idea in the get parameters of the widget config, and it would become an implementation detail the widget doesn't have to know about.)
2. User clicks on a URL (based in any idea panel) including the `widget_state` and voted idea ID as a GET argument.
Widget stores idea ID in `user_state` and proceeds from there.
It may also find that it has stored the user's interaction with that specific idea in the user_state.
It should then keep a "latest idea" reference in the user_state.
(benoitg:  still don't get why we would reference the idea id explicitely)

## Creation of Widget settings

This is always the first step.
The Widget expects to be called with a settings URL that yields a JSON.
That URL MAY be given in abbreviated form with a local: prefix.
TODO: Determine if that is useless shared knowledge.
The Widget MAY have a fallback settings URL.
If the Widget code is called without a settings URL, it SHOULD signal an error.
The Widget MAY receive as only settings information a Widget creation endpoint (`creation_endpoint`).
In that case, it SHOULD present a settings creation interface, where it will POST its settings.
(benoitg:  why different from settigns URL?)
The information it POSTs on its creation endpoint MUST contain the following arguments:

1. settings: a JSON blob
2. type: the Widget type (will determine server-side behaviour, classname in assembl)

It MAY also contain the following arguments:
(benoitg:  Don't want to gold plate, but since we have nonstandard PUT behaviour, 
maybe we shouldn't offer state and user state at that config URL at all.   Seems
like a bad compromise no one else will want to implement.  If we separate them, all that is 
required is "provide and endpoint that persists json

3. state: a JSON blob
4. user_state: a JSON blob (varies per user)

The Widget will obtain its `widget_url` back in the HTTP Location header.
That URL MAY be given in abbreviated form with a local: prefix. (Harmful?)

## Backend:  How to know which widgets apply to an idea

In the case of the creativity session, we have a designated root_idea. We need to go back from the idea to that session.

We also need to go from an idea created within a widget to the Creativity session or InspireMe Widget that proposed it.
In both those cases, we need access to some extra information, such as the inspiring card URI or Youtube URI.

Finally, we need to go from a votable/voted idea to the voting widget, but maybe also to display voting results on the idea after the vote is over.

In all cases, we need access to a typed widget-idea link.
The extra information can only be interpreted by the Widget; so it makes sense to store it in the Widget state.
We could also store it in a Widget-Idea link, but then we need to introduce more api endpoints. (And maybe even more for the messages.)
(And then we'd need per-user Widget-Idea link... sigh.)
However, it means that we need to be able to call on Widget UI code to interpret Widget data while displaying an Idea (or Message).
That introduces more endpoints on the Widget. 

Proposal: the Widget definition should include the name of a few views, and for each view, offer a JS function that can generate DOM using the JSON of the Idea (or message, appropriately) and the JSON of the full Widget information (`widget_state`, `user_state`, `settings`.)

## Security considerations

Right now, there is a single endpoint for `user_state`. There is also an endpoint for `user_states`, for voting tallies etc.
That endpoint is currently public, but should be reserved to discussion administrator.
We should either reserve a different endpoint for `public_user_state`, or have a `public` section within the `user_state` blob.
Another option is to compute aggregate information on the server in appropriate endpoints.
