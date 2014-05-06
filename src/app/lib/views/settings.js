(function(App) {
    "use strict";

    var Settings = Backbone.Marionette.ItemView.extend({
        template: '#settings-container-tpl',
        className: 'settings-container-contain',

        ui: {
            success_alert: '.success_alert'
        },

        events: {
            'click .settings-container-close': 'closeSettings',
            'change select,input': 'saveSetting',
            'click .rebuild-tvshows-database': 'rebuildTvShows'
        },

        onShow: function() {
            console.log('Show settings', this.model);
            $(".filter-bar").hide();    
            $("#movie-detail").hide();
        },

        onClose: function() {
            $(".filter-bar").show();    
            $("#movie-detail").show();
        },
        showCover: function() {},

        closeSettings: function() {
            App.vent.trigger('settings:close');     
        },

        saveSetting: function(e){
            var that = this;
            var value = false;
            var data = {};

            // get active field
            var field = $(e.currentTarget);
            
            // get right value
            if(field.is('input')) 
                value = field.val();
            else 
                value = $("option:selected", field).val();

            // TODO Perhaps add check to make sure its a valid API?
            // Also we should do a full resync
            if (field.attr('name') == 'tvshowApiEndpoint') 
                // add trailing slash
                if (value.substr(-1) != '/') value += '/';
            
            // update active session
            App.settings[field.attr('name')] = value;

            //save to db
            App.db.writeSetting({key: field.attr('name'), value: value}, function() {
                that.ui.success_alert.show().delay(3000).fadeOut(400);

                // TODO : We need to reload all view
                // or ask user to restart app
                if (field.attr('name') == 'language') 
                    // if field is language, set new language
                    // on active session
                    i18n.setLocale(value);
                
            });
        },


        rebuildTvShows: function() {
            var that = this;

            // we build our notification
            var $el = $('#notification');
            $el.html(
                '<h1>' + i18n.__('Please wait') + '...</h1>'   +
                '<p>' + i18n.__('We are rebuilding the TV Show Database. Do not close the application.') + '.</p>'
            ).addClass('red');

            // enable the notification on current view
            $('body').addClass('has-notification')

            Database.initDB(function(err, setting) {

                // we write our new update time
                AdvSettings.set("tvshow_last_sync",+new Date());

                // ask user to restart (to be sure)
                $el.html(
                    '<h1>' + i18n.__('Success') + '</h1>'   +
                    '<p>' + i18n.__('Please restart your application.') + '.</p>' +
                    '<span class="btn-grp">'                        +
                        '<a class="btn restart">' + i18n.__('Restart') + '</a>'    +
                    '</span>'
                ).removeClass().addClass('green');

                // add restart button function
                var $restart = $('.btn.restart');
                $restart.on('click', function() {
                    var spawn = require('child_process').spawn,
                        argv = gui.App.fullArgv,
                        CWD = process.cwd();
                    
                    argv.push(CWD);
                    spawn(process.execPath, argv, { cwd: CWD, detached: true, stdio: [ 'ignore', 'ignore', 'ignore' ] }).unref();
                    gui.App.quit();
                });

            });
        }


    });

    App.View.Settings = Settings;
})(window.App);

