const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const VnstatIndicator = new Lang.Class({
  Name: 'VnstatIndicator', Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "Vnstat Indicator", false);

    this.buttonText = new St.Label({
      text: _("Loading..."),
      y_align: Clutter.ActorAlign.CENTER
    });

    this.actor.add_actor(this.buttonText);
    this._createPopupMenu();
    this._refresh();
  },

  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this._refresh));

    return true;
  },

  _createPopupMenu: function() {
    this.menu.removeAll();

    let settings = Convenience.getSettings();
    let currentInterface = settings.get_string('interface');
    this.item = new PopupMenu.PopupMenuItem(currentInterface);
    this.menu.addMenuItem(this.item);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    cmd = "sh -c \"ls /sys/class/net/ -1\"";
    let [res, out, err] = GLib.spawn_command_line_sync(cmd);    
    let interfaces = out.toString().split("\n");
    interfaces = interfaces.slice(0, interfaces.length - 1);

    for (let interface of interfaces) {
      if (currentInterface != interface) {
        this.item = new PopupMenu.PopupMenuItem(interface);
        this.menu.addMenuItem(this.item);
        this._changeInterfaceId = this.item.connect('activate', Lang.bind(this, this._changeInterface));
      }
    }

    this.itemSettings = new PopupMenu.PopupMenuItem(_("Settings"));
    this.menu.addMenuItem(this.itemSettings);
    this._itemSettingsId = this.itemSettings.connect('activate', Lang.bind(this, this._openSettings));
  },

  _openSettings: function() {
    Util.spawn([ "gnome-shell-extension-prefs", Me.uuid ]);
  },

  _changeInterface: function(it) {
    let settings = Convenience.getSettings();
    settings.set_string('interface', it.label.get_text());
    this._loadData();
    this._createPopupMenu();
  },

  _loadData: function () {
    let settings = Convenience.getSettings();

    let interface = settings.get_string('interface') || _("wlp3s0");

    cmd = "sh -c \"vnstat -i " + interface + " -d -s | grep today | awk '{printf \\\"%s %s\\\", $8, $9}'\"";
    let [res, out, err] = GLib.spawn_command_line_sync(cmd);

    if (out.toString().length > 0) {
      this.buttonText.set_text(out.toString());
    } else {
      this.buttonText.set_text("0 KiB");
    }
  },

  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (this._timeout)
      Mainloop.source_remove(this._timeout);

    this._timeout = undefined;
    this.menu.removeAll();
  }
});

let vnstatMenu;

function init() {}

function enable() {
  vnstatMenu = new VnstatIndicator;
  Main.panel.addToStatusArea('vnstat-indicator', vnstatMenu);
}

function disable() {
  vnstatMenu.destroy();
}