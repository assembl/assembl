Example debate fixture
======================

This example debate was created to serve as an example in UI mookups, specifications, etc. It is designed to show a maximum of corner cases in a debate that is as short as possible. It was created in a role playing game caricaturing well known public figures in Québec.

Flow of messages:

* Lines are the threading of the messages, as would be seen in am mail client supporting threading
* The number at the begining of the line is the actual chronological order of the messages
* Brackets fragments of text tagged by the catcher to identify concepts. ``[FragmentId: original text fragment]``

::

    1-  Harper says: Let's [A:lower taxes] to [B:favor economic growth].
        |
    2-  |-Khadir says: [E:You will put everyone out of a job]!
        | |
    17- | |-Late participant says:  That makes no sense, why would that make anyone lose his job?
        |   |
    18- |   |-Syndicalist says:  With [H: lower government revenue], the [I: government will be forced to cut jobs].
        |
    3-  |-Mulcair says: Lowering taxes is a terrible idea!
        | |
    5-  | |-Typical Quebecker: Jack Layton was a nice guy, he's dead.
        | | |
    6-  | | |-Animator: And what did he think of of [M:lowering taxes]?
        | |   |
    7-  | |   |-Typical Quebecker: He was against it.
        | |     |
    11- | |     |-Animator: Why?
        | |       |
    12- | |       |-Typical Quebecker: I don't know...
        | |         |
    13- | |         |-Animator: But you agree with him on that?
        | |           |
    14- | |           |-Typical Quebecker: Yes!
        |
    4-  |-Suzuki says: [B:Economic growth] will mean [C:more resource consumption], and that's [D:bad for the environment].
          |
    8-    |-Krugman says: [In a recession], [F:austerity] is actually [G:contractionary].
            |
    9-      |-Animator: Huh? Not sure I follow you...
            | |
    10-     | |-Krugman: Lowering taxes causes austerity, which reduces economic activity.
            | |
    15-     | |-Syndicalist says:  [J:People loose their job]!
            |   |
    16-     |   |-Québec city talk radio says:  Union workers are all lazy bums, good riddance!
            |
    19-     |-Suzuki says: Maybe, but with the most severe [N: cuts in environmental programs], it's still [K:no good for the environment].
              |
    20-       |-Harper says:  [L:Federal environmental programs are ineffective] and a waste of money.

A resulting debate map (lazy catcher):

::

    A: Lower taxes
       |-> B:favor economic growth
       |  |-> C:more resource consumption
       |       |-> D:bad for the environment
       |-> E:you will put everyone out of a job
       |-> F:austerity
       |   |-> G:economic contraction
       |   |-> J:People loose their job
       |   |-> K:no good for the environment
               |-> L:Federal environmental programs are ineffective
       |-> H:lower government revenue
           |-> I:government will be forced to cut jobs

A different resulting debate map (duplicates removed):

::

    A: Lower taxes
       |-> B:favor economic growth
       |  |-> C:more resource consumption
       |       |-> bad for environment [D:bad for the environment|K:no good for the environment]
                   |-> L:Federal environmental programs are ineffective
       |-> H:lower government revenue
           |-> F:austerity
               |-> G:economic contraction
               |-> job loss (I:government will be forced to cut jobs|E:you will put everyone out of a job|J:People loose their job)
               |-> bad for environment [D:bad for the environment|K:no good for the environment] ... (canonical tree is above)

What posts would be displayed if a participant clicks "job loss" in the debate map above:

::

    2-  ... Khadir says [E:you will put everyone out of a job]
            |
    17-     |-Late participant says:  That makes no sense, why would that make anyone lose his job?
              |
    18-       |-Syndicalist says:  With [H: lower government revenue], the [I: government will be forced to cut jobs]
    15- ... Syndicalist says:  [J:People loose their job]!
            |
    16-     |-Québec city talk radio says:  Union workers are all lazy bums, good ridance!



Alternative 2:
This is the version in the fixtures, with thread-breaking links to posts 5 and 16.

::

    1 Favor economic growth [B, M, -16, -5]
    1_1 Lower taxes [A]
    1_1_1 Lower government revenue [H]
    1_1_1_1 Austerity yields contraction [F, G, -16]
    1_1_1_1_1 Job loss [I, J, -16]
    1_1_1_1_2 Environmental program cuts [N]
    1_1_1_1_2_1 Bad for the environment [K]
    1_1_1_1_2_2 Federal programs are ineffective [L]
    1_2 Increased reseource consumption [C, -16]
    1_2_1 Bad for the environment [D, -16]

