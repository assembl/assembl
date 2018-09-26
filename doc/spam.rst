How to not be marked as spam
============================

There's a number of things to do so the subscription and notification emails don't go in the client's spam folder. The following assumes the application server handles mail.

In most cases, the mail domain name and the application domain name will be identical; but we will distinguish them below.

Important: The reverse DNS of the server (both IPv4 and IPv6) must point back to the mail domain name.

See the :ref:`vmm` documentation for further postfix configuration, even if you don't install vmm.

DNS records
-----------

You should set ``MX``, ``SPF`` and ``DMARC``:

    MX mail_domain_name  10  mail_domain_name 
    TXT mail_domain_name v=spf1 mx -all
    SPF mail_domain_name v=spf1 mx -all
    TXT _dmarc.mail_domain_name v=DMARC1;p=reject;rua=mailto:postmaster@mail_domain_name

and, if domains are different::

    MX application_domain_name  10  mail_domain_name
    TXT application_domain_name v=spf1 mx -all
    SPF application_domain_name v=spf1 mx -all


DKIM procedure
--------------

Mostly following

https://help.ubuntu.com/community/Postfix/DKIM

.. code-block:: sh

    sudo apt-get install opendkim opendkim-tools

    sudo mkdir -p /etc/opendkim/keys    # if necessary
    sudo chown opendkim:opendkim /etc/opendkim /etc/opendkim/keys
    cd !$
    sudo -u opendkim opendkim-genkey -t -s mail -d mail_domain_name
    # They should be in -rw------- mode.
    
    sudo cat mail.txt

You'll see something like::

    mail._domainkey IN  TXT ( "v=DKIM1; k=rsa; t=y; "
        "p=MIGfMA0GCS......" )  ; ----- DKIM key mail for mail_domain_name

The quoted value (make sure to collapse quotes) needs to be a TXT record in the DNS for
``mail._domainkey.mail_domain_name``

While you're there, there should be another TXT record for
``_dmarc.mail_domain_name`` containing ``v=DMARC1; p=reject; rua=postmaster@myorganization.com``

(Use a postmaster address that exists; it can be on the same domain on your organization's domain)

.. code-block:: sh

    sudo mv mail.private mail_domain_name.private
    sudo mv mail.txt mail_domain_name.txt

# IF THERE IS A SINGLE ASSEMBL SERVER ON YOUR MACHINE

Edit ``/etc/opendkim.conf`` to add or set::

    AutoRestart             Yes
    AutoRestartRate         10/1h
    Domain          mail_domain_name
    KeyFile     /etc/opendkim/keys/mail_domain_name.private
    Selector        mail
    Canonicalization    relaxed/simple
    Socket        inet:12345@localhost

# ELSE, IF THERE ARE MULTIPLE ASSEMBL SERVERS ON YOUR MACHINE, EACH WITH ITS DOMAIN NAME:

Edit ``/etc/opendkim.conf`` to add or set::

    AutoRestart             Yes
    AutoRestartRate         10/1h
    Selector        mail
    Canonicalization    relaxed/simple
    Socket        inet:12345@localhost
    ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
    InternalHosts           refile:/etc/opendkim/TrustedHosts
    KeyTable                refile:/etc/opendkim/KeyTable
    SigningTable            refile:/etc/opendkim/SigningTable

Edit ``/etc/opendkim/TrustedHosts``::

    localhost
    127.0.0.1
    mail_domain_name_1
    mail_domain_name_2
    ...

Edit ``/etc/opendkim/KeyTable``::

    mail._domainkey.mail_domain_name_1 mail_domain_name_1:mail:/etc/opendkim/keys/mail_domain_name_1.private
    mail._domainkey.mail_domain_name_2 mail_domain_name_2:mail:/etc/opendkim/keys/mail_domain_name_2.private
    ...

Edit ``/etc/opendkim/SigningTable``::

    *@mail_domain_name_1 mail._domainkey.mail_domain_name_1
    *@mail_domain_name_2 mail._domainkey.mail_domain_name_2
    ...


# ENDIF

Edit ``/etc/default/opendkim``
Uncomment::

    SOCKET="inet:12345@localhost"

And comment out (if necessary)::

    SOCKET="local:/var/run/opendkim/opendkim.sock"

.. code-block:: sh

    sudo /etc/init.d/opendkim start

If it fails, try removing the Socket line from ``/etc/opendkim.conf``, it works on some servers and not others.

.. code-block:: sh

    tail /var/log/mail.log

and make sure you see::

    OpenDKIM Filter v2.10.3 starting (args: -x /etc/opendkim.conf -u opendkim -P /var/run/opendkim/opendkim.pid -p inet:12345@localhost)

vs::

    OpenDKIM Filter v2.10.3 starting (args: -x /etc/opendkim.conf -u opendkim -P /var/run/opendkim/opendkim.pid -p local:/var/run/opendkim/opendkim.sock)


When DNS is propagated, edit ``/etc/postfix/main.cfg`` and append::

    # DKIM
    milter_default_action = accept
    milter_protocol = 2
    smtpd_milters = inet:localhost:12345
    non_smtpd_milters = inet:localhost:12345

.. code-block:: sh

    sudo /etc/init.d/postfix restart

