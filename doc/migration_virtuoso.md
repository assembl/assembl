To migrate from virtuoso 6 to virtuoso 7:

1. ensure your old (6) virtuoso_root is defined in the local.ini file (or develop or...) Its value may be 'system'.
2. fab devenv database_dump
4. fab devenv ensure_virtuoso_not_running
5. in local.ini, change virtuoso_root to have a new location for the v7 binaries. Also define virtuoso_src and virtuoso_branch. Eg:
    virtuoso_root = virtuoso
    virtuoso_src = ../virtuoso_src
    virtuoso_branch = develop/7
3. fab devenv virtuoso_source_install_7
6. fab devenv database_start
