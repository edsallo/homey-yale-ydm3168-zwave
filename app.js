'use strict';

const Homey = require('homey');

class YaleLockApp extends Homey.App {

  async onInit() {

    this.log('Yale Lock started');

    this.trigger_homey_locked = this.homey.flow.getDeviceTriggerCard('homey_locked');
    this.trigger_homey_unlocked = this.homey.flow.getDeviceTriggerCard('homey_unlocked');

    this.trigger_manual_locked = this.homey.flow.getDeviceTriggerCard('manual_locked');
    this.trigger_manual_unlocked = this.homey.flow.getDeviceTriggerCard('manual_unlocked');

    this.trigger_user_unlocked = this.homey.flow.getDeviceTriggerCard('user_unlocked');

    this.trigger_touchpad_locked = this.homey.flow.getDeviceTriggerCard('touchpad_locked');
    this.trigger_touchpad_unlocked = this.homey.flow.getDeviceTriggerCard('touchpad_unlocked');

    this.trigger_auto_locked = this.homey.flow.getDeviceTriggerCard('auto_locked');

    this.trigger_tamper_alarm = this.homey.flow.getDeviceTriggerCard('tamper_alarm');
    this.trigger_battery_alarm = this.homey.flow.getDeviceTriggerCard('battery_alarm');

  }

}

module.exports = YaleLockApp;
