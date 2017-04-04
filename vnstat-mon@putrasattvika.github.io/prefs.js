// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain('gnome-shell-extensions');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
	Convenience.initTranslations();
}

const VnstatmonPrefsWidget = new GObject.Class({
	Name: 'vnstat-mon.Prefs.Widget',
	GTypeName: 'VnstatmonPrefsWidget',
	Extends: Gtk.Grid,

	_init: function(params) {
		this.parent(params);
		this.margin = 12;
		this.row_spacing = this.column_spacing = 6;
		this.set_orientation(Gtk.Orientation.VERTICAL);
		this._settings = Convenience.getSettings();

		cmd = "sh -c \"ls /sys/class/net/ -1\"";
    	let [res, out, err] = GLib.spawn_command_line_sync(cmd);
    	interfaces = out.toString().split("\n");
    	interfaces = interfaces.slice(0, interfaces.length);

        label = new Gtk.Label({
            label: _('Network interface'),
            hexpand: true,
            halign: Gtk.Align.START
        });

        widget = new Gtk.ComboBoxText();

        for (var i = interfaces.length - 1; i >= 0; i--) {
        	widget.append(interfaces[i], interfaces[i]);
        }

        this._settings.bind('interface', widget, 'active-id', Gio.SettingsBindFlags.DEFAULT);
        this.attach(label, 0, 7, 1, 1);
        this.attach(widget, 1, 7, 1, 1);
	}
});

function buildPrefsWidget() {
	let widget = new VnstatmonPrefsWidget();
	widget.show_all();

	return widget;
}
