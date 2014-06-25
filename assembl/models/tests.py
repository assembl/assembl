# -*- coding: utf-8 -*-

import json
import pytest
from urllib import urlencode, quote_plus
import lxml.html

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
    
def check_striping_html(original, expected, fail_msg):
    result = AbstractMailbox.strip_full_message_quoting_html(original)
    expected = lxml.html.tostring(lxml.html.fromstring(expected), pretty_print=True)
    original = lxml.html.tostring(lxml.html.fromstring(original), pretty_print=True)
    result = lxml.html.tostring(lxml.html.fromstring(result), pretty_print=True)
    assert result == expected, "Failed striping quotations for case %s, message was: \n------\n%s\n------\nExpected: \n------\n%s\n------\nInstead received: \n------\n%s\n------\n" % (
                                fail_msg,
                                original,
                                expected,
                                result)
        
def test_strip_quotations_html_gmail():
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
    
    check_striping_html(original, expected, "Gmail")
    
def test_strip_quotations_html_applemail():
    original = """
<html>
   <head></head>
   <body style="word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space; ">
      Salutation outside any html tag,
      <div><br></div>
      <div>Some actual text</div>
      <div>
         <br>
         <div>
            Signature
         </div>
         <br>
         <div>
            <div>Le 6 juin 2011 à 11:02, Jean-Michel Cornu a écrit :</div>
            <br class="Apple-interchange-newline">Some quoted text
            <br>
         </div>
         <br>
      </div>
   </body>
</html>
"""

    expected = """
<html>
   <head></head>
   <body style="word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space; ">
      Salutation outside any html tag,
      <div><br></div>
      <div>Some actual text</div>
      <div>
         <br>
         <div>
            Signature
         </div>
         <br>
         
         <br>
      </div>
   </body>
</html>
"""
    check_striping_html(original, expected, "Apple mail french, old version")
    
    
    original = """
<html>
   <head>
      <meta http-equiv="Content-Type" content="text/html charset=iso-8859-1">
   </head>
   <body style="word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space;">
      Test 3 
      <div>
         <br>
         <div style="">
            <div>On Jun 25, 2014, at 2:44 PM, Benoit Grégoire <<a href="mailto:benoitg@coeus.ca">benoitg@coeus.ca</a>> wrote:</div>
            <br class="Apple-interchange-newline">
            <blockquote type="cite">
               <div style="font-size: 9pt; font-style: normal; font-variant: normal; font-weight: 400; letter-spacing: normal; line-height: normal; orphans: auto; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: auto; word-spacing: 0px; -webkit-text-stroke-width: 0px; font-family: 'Sans Serif';">
                  <div style="white-space: pre-wrap; margin: 0px; text-indent: 0px;">This is a <span style="font-weight: 600;">HTML</span> <span style="font-style: italic;">fragment</span></div>
                  <div style="white-space: pre-wrap; margin: 0px; text-indent: 0px;">-- </div>
                  <div style="white-space: pre-wrap; margin: 0px; text-indent: 0px;">Benoit Grégoire, ing., PMP, PSM</div>
               </div>
            </blockquote>
         </div>
         <br>
      </div>
   </body>
</html>
"""
    expected = """
<html>
   <head>
      <meta http-equiv="Content-Type" content="text/html charset=iso-8859-1">
   </head>
   <body style="word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space;">
      Test 3 
      
   </body>
</html>
"""
    check_striping_html(original, expected, "Apple mail English recent")

def test_strip_quotations_html_outlook():
    original = """
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<HTML>
   <HEAD>
      <META http-equiv=Content-Type content="text/html; charset=iso-8859-1">
      <META content="MSHTML 6.00.6000.21264" name=GENERATOR>
   </HEAD>
   <BODY>
      <DIV dir=ltr align=left><SPAN class=847504013-06062011><FONT face=Arial 
         color=#0000ff size=2>Some text</FONT></SPAN>
      </DIV>
      <BLOCKQUOTE style="MARGIN-RIGHT: 0px">
         <DIV class=OutlookMessageHeader lang=fr dir=ltr align=left>
            <HR tabIndex=-1>
            <FONT face=Tahoma size=2><B>De :</B> jmichelcornu@gmail.com 
            [mailto:jmichelcornu@gmail.com] <B>De la part de</B> Jean-Michel 
            Cornu<BR><B>Envoyé :</B> 06 June 2011 11:03<BR><B>À :</B> innovation 
            monétaire<BR><B>Objet :</B> [innovationmonetaire] Démarrage de 
            l'expédition sur l'innovation monétaire<BR></FONT><BR>
         </DIV>
         <DIV></DIV>
         Begin actual quote content
      </BLOCKQUOTE>
      <PRE>Signature</PRE>
   </BODY>
</HTML>
"""
    expected = """
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<HTML>
   <HEAD>
      <META http-equiv=Content-Type content="text/html; charset=iso-8859-1">
      <META content="MSHTML 6.00.6000.21264" name=GENERATOR>
   </HEAD>
   <BODY>
      <DIV dir=ltr align=left><SPAN class=847504013-06062011><FONT face=Arial 
         color=#0000ff size=2>Some text</FONT></SPAN>
      </DIV>
      
      <PRE>Signature</PRE>
   </BODY>
</HTML>
"""
    check_striping_html(original, expected, "Outlook recent")


