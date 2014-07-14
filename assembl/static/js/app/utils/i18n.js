/**
 * Wrapper for Jed
 * 
 * */
 define(['jed'], function(Jed){
         /*if ( !dict ) {
             return;
         }

         if ( typeof dict !== 'object' ) {
             throw new Error('dict argument must be an object.');
         }

         if ( dict.length > 0 ) {
             throw new Error('dict argument cannot be an array.');
         }*/
         return new Jed({
             // Generally output by a .po file conversion
             locale_data : {
               "messages" : {
                 "" : {
                   "domain" : "messages",
                   "lang"   : "en",
                   "plural_forms" : "nplurals=2; plural=(n != 1);"
                 },
                 "some key" : [ null, "some value"]
               }
             },
             "domain" : "messages"
           });

});