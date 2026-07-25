'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class YDM3168 extends ZwaveDevice {

  async onNodeInit() {


    this.log('YDM3168 initialized');

    // 🔐 LOCK capability
    this.registerCapability('locked', 'DOOR_LOCK', {
      getOpts: {
        getOnStart: true,
      },
      get: 'DOOR_LOCK_OPERATION_GET',
      set: 'DOOR_LOCK_OPERATION_SET',

      setParser: value => ({
        'Door Lock Mode': value ? 'Door Secured' : 'Door Unsecured'
      }),

      report: 'DOOR_LOCK_OPERATION_REPORT',

      reportParser: report => {
        this.log('LOCK REPORT:', report);
        return report['Door Lock Mode'] === 'Door Secured';
      }
    });

    // 🚨 ALARM parsing (основная логика)
    this.registerCapability('locked', 'ALARM', {

      report: 'ALARM_REPORT',

      reportParser: report => {

        this.log('ALARM REPORT:', report);

        if (!report.hasOwnProperty("Alarm Type")) return null;

        const type = report['Alarm Type'];
        const level = report['Alarm Level'];

        // 🔓 unlock by pin
        if (type == '19' && level) {
          this.homey.app.trigger_user_unlocked?.trigger(this, { userid: level }).catch(this.error);
          this.homey.app.trigger_touchpad_unlocked?.trigger(this).catch(this.error);
          return false;
        }

        // 🔒 locked
        if (type == '21' && level) {
          if (level == '1') {
            this.homey.app.trigger_manual_locked?.trigger(this).catch(this.error);
          }
          if (level == '2') {
            this.homey.app.trigger_touchpad_locked?.trigger(this).catch(this.error);
          }
          return true;
        }

        // 🔓 manual unlock
        if (type == '22' && level) {
          this.homey.app.trigger_manual_unlocked?.trigger(this).catch(this.error);
          return false;
        }

        // 🔒 via Homey
        if (type == '24') {
          this.homey.app.trigger_homey_locked?.trigger(this).catch(this.error);
          return true;
        }

        // 🔓 via Homey
        if (type == '25') {
          this.homey.app.trigger_homey_unlocked?.trigger(this).catch(this.error);
          return false;
        }

        // 🔒 auto lock
        if (type == '27' && level == '1') {
          this.homey.app.trigger_auto_locked?.trigger(this).catch(this.error);
          return true;
        }

        // 🚨 tamper
        if (type == '161') {
          this.homey.app.trigger_tamper_alarm?.trigger(this, {}, { alarmtype: level }).catch(this.error);
          return null;
        }

        // 🔋 battery
        if (type == '167') {
          this.homey.app.trigger_battery_alarm?.trigger(this, {}, { alarmtype: '1' }).catch(this.error);
          return null;
        }

        if (type == '168') {
          this.homey.app.trigger_battery_alarm?.trigger(this, {}, { alarmtype: '2' }).catch(this.error);
          return null;
        }

        if (type == '169') {
          this.homey.app.trigger_battery_alarm?.trigger(this, {}, { alarmtype: '3' }).catch(this.error);
          return null;
        }

        return null;
      }

    });

  }

  // =========================
  // DELAY
  // =========================

  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // =========================
  // SETTINGS (USER CODES)
  // =========================

  async onSettings({ newSettings, changedKeys }) {

    this.log('SETTINGS CHANGED:', changedKeys);

    for (const key of changedKeys) {

      const match = key.match(/^slot(\d+)_code$/);
      if (!match) continue;

      const slot = parseInt(match[1], 10);
      const code = String(newSettings[key] || '').trim();

      if (code && !/^\d{4,10}$/.test(code)) {
        throw new Error(`PIN for slot ${slot} must contain 4 to 10 digits.`);
      }

      try {
        await this.node.CommandClass.COMMAND_CLASS_USER_CODE.USER_CODE_SET({
          'User ID': slot,
          'User ID Status': code ? 'Occupied' : 'Available',
          'User Code': code,
        });
        this.log(`Updated PIN slot ${slot}`);

      } catch (err) {
        this.error(`SLOT ${slot} ERROR`, err);
        throw err;
      }

    }

  }

}

module.exports = YDM3168;
