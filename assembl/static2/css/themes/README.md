# Adding new themes

You can create additional themes by creating a folder with a theme.scss inside.
Use the default theme as an example (this is the "default" folder).


# Using a git repository to store themes

In the `configs/{your_environment}.rc` configuration file, set variables `theme_repositories__git-urls` and `theme2_repositories__git-urls` to the git URL of your themes repositories. For example:

```
theme_repositories__git-urls = git@github.com:myorganization/assembl-client-themes.git
theme2_repositories__git-urls = git@github.com:myorganization/assembl2-client-themes.git
```

These repositories will be fetched when you run assembl's upgrade commands, and will be pointed to the same branch as assembl code if possible.

If you use several theme repositories (that is if you use both theme systems of Assembl, or use several repositories for one theme system), and these repositories are stored on github with restricted permissions, authentication to repositories can be tricky. Follow these steps:
* Create a specific github user, for example "yourorganization-bot"
* Add it as member of these themes repositories, with a read-only permission (no write permission)
* Go to the Settings page of this github user, section "SSH and GPG keys". For each of your Assembl servers, add the SSH public key of the system user which runs assembl (for example, in `/home/assembl_user/.ssh/id_rsa.pub`). If your server does not have an SSH key yet, create one.


# Defining which theme is shown as default

You can select which theme is active with default_theme in the ini file.
For example:
default_theme = folder_you_created


# Adding new theme variables

If you have a UI element for which you want a new specific themable color to be available, then follow these steps:

* Create a new variable in `static2/css/variables.scss`, and define its default value. For example, if you want to define a themable color for text links which appear in the footer, add: `$footer-link-text-color: #cccccc;`
* Use this variable in the CSS rules of your UI element. For example, in `static2/css/components/footer.scss`, add `.footer a { color: $footer-link-text-color; }`
* Clear your browser cache, recompile CSS (for example using `npm run build` from within the `static2` folder), and see that result corresponds to your needs. Iterate if it's not the case yet.
* If you think that this new variable is very likely to be overriden in futures themes, then copy the variable definition you wrote in `static2/css/variables.scss` to `static2/css/themes/default/_theme.scss`. As it is recommended that any new theme is copied from the default theme as starting point, any another new theme from now on will directly mention this variable and make it easy for the theme creator to override.
* Overload the value of your new variable in another theme. For example, if you have already created the `sandbox` theme and if you store your themes in a repository called `your-themes-repository`, then copy the variable definition to `static2/css/themes/vendor/your-themes-repository/sandbox/_theme.scss`, and set a different color value for this variable.


