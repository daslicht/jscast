"use strict";

var _ = require('underscore');

// Note: All exported functions are called with `this` being the JSCast instance

// Shoutcast-style API
exports.shoutcast = function shoutcast(req, res) {
    var self = this,
        command = req.query.mode || 'index',
        password = req.query.pass,
        requireAdmin = (command !== 'updinfo');

    this.authenticate(req.ip, password, requireAdmin, function(valid) {
        if(!valid) {
            res.send(403, 'Authentication failed.');
            return;
        }

        if(!shoutcastCommands[command]) {
            res.send(404, 'Not Found.');
        }
        else {
            shoutcastCommands[command].call(self, req, res);
        }
    });
};

exports.index = function index(req, res) {
    res.render('admin.jade', {
        clients: this.clientManager.clients,
        source: this.activeSource,
        metadata: this.metadata
    });
};

exports.kickListener = function kickListener(req, res) {
    this.clientManager.kickClient(req.params.id);
    console.log('Kicked listener');
    res.redirect('/admin/');
};

exports.kickSource = function kickSource(req, res) {
    this.kickSource();
    res.redirect('/admin/');
};

var shoutcastCommands = {
    index: function index(req, res) {
        res.redirect('/admin/');
    },

    updinfo: function updinfo(req, res) {
        var song = req.query.song;
        var queryString, match;
        if(/%[A-F0-9]{2}/.test(song) && ~((queryString = require('url').parse(req.url).query).indexOf(song))) {
            // We got something that was not UTF8 and thus need to extract and decode it (assuming iso-8859-1)
            // Of course this is super ugly but the only safe way avoid problems in the unlikely case that a valid
            // song title actually contains %XX (and thus already decoded successfully).
            if((match = /(?:[?&]|^)song=([^&#]*)/.exec(queryString))) {
                song = match[1].replace(/%([A-F0-9]{2})/gi, function(f, m1) {
                    return String.fromCharCode(parseInt(m1, 16));
                });
            }
        }
        this.songTitleReceived(song);
        res.end();
    },

    kicksrc: function kicksrc(req, res) {
        this.kickSource();
        res.end();
    }
};
