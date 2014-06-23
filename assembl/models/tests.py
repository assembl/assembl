# -*- coding: utf-8 -*-

import json
import pytest
from urllib import urlencode, quote_plus

from assembl.models import (
    AbstractMailbox, Email
)


def test_strip_quotations_plaintext():
    def check_striping(original, expected, fail_msg):
        expected = expected.strip()
        result = AbstractMailbox.strip_full_message_quoting_plaintext(original).strip()
        assert result == expected, "Failed striping quotations for case %s, message was: \n------\n%s\n------\nExpected: \n------\n%s\n------\nInstead received: \n------\n%s\n------\n" % (fail_msg, original,expected,result)

    original = """

Hello,

This text is the real text

Le 6 juin 2011 11:02, Jean-Michel Cornu <Jean-Michel@cornu.eu.org> a écrit :
> Some quotation we dont want
> As it ends on the last non-empty line of the message
>

    """
    expected = """

Hello,

This text is the real text
    """
    
    check_striping(original, expected, "Gmail plaintext, french")
    
    
    original = """

Yes, let's give access to the sandbox for the Professor from Hawai.

Thanks

Frank

2014-06-17 10:32 GMT-04:00 Benoit Gr=C3=A9goire <benoitg@coeus.ca>:

> On June 17, 2014 10:13:04 AM Laura Gillies wrote:
> > Hello,
> >
    """
    expected = """

Yes, let's give access to the sandbox for the Professor from Hawai.

Thanks

Frank
    """
    
    check_striping(original, expected, "Gmail plaintext, us 2014")
    
def test_strip_quotations_html():
    import lxml.html
    def check_striping(original, expected, fail_msg):
        result = AbstractMailbox.strip_full_message_quoting_html(original)
        expected = lxml.html.tostring(lxml.html.fromstring(expected), pretty_print=True)
        original = lxml.html.tostring(lxml.html.fromstring(original), pretty_print=True)
        result = lxml.html.tostring(lxml.html.fromstring(result), pretty_print=True)
        assert result == expected, "Failed striping quotations for case %s, message was: \n------\n%s\n------\nExpected: \n------\n%s\n------\nInstead received: \n------\n%s\n------\n" % (
                                    fail_msg,
                                    original,
                                    expected,
                                    result)

    original = """
<div dir="ltr">Reply text<br></div>
<div class="gmail_extra"><br><br>
<div class="gmail_quote">2014-06-18 17:30 GMT-04:00 Benoit Grégoire <span dir="ltr">&lt;<a href="mailto:benoitg@coeus.ca" target="_blank">benoitg@coeus.ca</a>&gt;</span>:<br>
<blockquote class="gmail_quote" style="margin:0 0 0 .8ex;border-left:1px #ccc solid;padding-left:1ex">original content<br>
<span class="HOEnZb"><font color="#888888">--<br>
Benoit Grégoire, ing., PMP, PSM<br>
</font></span></blockquote>
</div>
<br></div>
    """
    expected = """
<div dir="ltr">Reply text<br></div>
<div class="gmail_extra"><br><br>

<br></div>
    """
    
    check_striping(original, expected, "Gmail")
