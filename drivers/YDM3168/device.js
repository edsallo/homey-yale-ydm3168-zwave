'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

class YDM3168 extends ZwaveDevice {

  async onNodeInit() {
    this.log('YDM3168 initialized');

    if (this.hasCapability('button.read_user_codes')) {
      await this.removeCapability('button.read_user_codes');
    }

    // YDM3168 implements Door Lock command-class v1. The system mapping only
    // provides a v2 parser, so keep the payload explicit for this lock.
    this.registerCapability('locked', 'DOOR_LOCK', {
      getOpts: {
        getOnStart: true,
      },
      get: 'DOOR_LOCK_OPERATION_GET',
      set: 'DOOR_LOCK_OPERATION_SET',
      setParserV1: value => ({
        'Door Lock Mode': value ? 'Door Secured' : 'Door Unsecured',
      }),
      report: 'DOOR_LOCK_OPERATION_REPORT',
      reportParserV1: report => {
        if (!report || !Object.prototype.hasOwnProperty.call(report, 'Door Lock Mode')) return null;
        return report['Door Lock Mode'] === 'Door Secured';
      },
    });

    // 🚨 ALARM parsing (основная логика)
    // This Yale Z-Wave module reports physical lock activity via the legacy
    // Alarm Command Class. It does not expose the newer Notification class.
    this.registerCapability('locked', 'ALARM', {

      report: 'ALARM_REPORT',

      reportParser: report => {

        this.log('ALARM REPORT:', report);

        if (!report.hasOwnProperty("Alarm Type")) return null;

        const type = report['Alarm Type'];
        const level = report['Alarm Level'];

        // 🔓 unlock by pin
        if (type == '19' && level) {
          this._triggerFlow('trigger_user_unlocked', { userid: level });
          this._triggerFlow('trigger_touchpad_unlocked');
          return false;
        }

        // 🔒 locked
        if (type == '21' && level) {
          if (level == '1') {
            this._triggerFlow('trigger_manual_locked');
          }
          if (level == '2') {
            this._triggerFlow('trigger_touchpad_locked');
          }
          return true;
        }

        // 🔓 manual unlock
        if (type == '22' && level) {
          this._triggerFlow('trigger_manual_unlocked');
          return false;
        }

        // 🔒 via Homey
        if (type == '24') {
          this._triggerFlow('trigger_homey_locked');
          return true;
        }

        // 🔓 via Homey
        if (type == '25') {
          this._triggerFlow('trigger_homey_unlocked');
          return false;
        }

        // 🔒 auto lock
        if (type == '27' && level == '1') {
          this._triggerFlow('trigger_auto_locked');
          return true;
        }

        // 🚨 tamper
        if (type == '161') {
          this._triggerFlow('trigger_tamper_alarm', {}, { alarmtype: level });
          return null;
        }

        // 🔋 battery
        if (type == '167') {
          this._triggerFlow('trigger_battery_alarm', {}, { alarmtype: '1' });
          return null;
        }

        if (type == '168') {
          this._triggerFlow('trigger_battery_alarm', {}, { alarmtype: '2' });
          return null;
        }

        if (type == '169') {
          this._triggerFlow('trigger_battery_alarm', {}, { alarmtype: '3' });
          return null;
        }

        return null;
      }

    });

  }

  _triggerFlow(cardName, tokens = {}, state = {}) {
    const card = this.homey.app[cardName];
    if (!card) return;

    card.trigger(this, tokens, state).catch(err => {
      this.error(`Flow trigger ${cardName} failed`, err);
    });
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
      // The Yale keypad numbers PINs 41-50; Z-Wave exposes those same PIN
      // locations as the logical User Code IDs 1-10.
      const userId = slot;

      if (code && !/^\d{6,12}$/.test(code)) {
        throw new Error(`PIN for slot ${slot} must contain 6 to 12 digits.`);
      }

      try {
        const userCode = Buffer.from(code, 'ascii');
        this.log(`PIN slot ${slot}: payload prepared`, {
          isBuffer: Buffer.isBuffer(userCode),
          constructor: userCode.constructor.name,
          length: userCode.length,
        });
        await this.node.CommandClass.COMMAND_CLASS_USER_CODE.USER_CODE_SET({
          'User Identifier': userId,
          'User ID Status': code ? 'Occupied' : 'Available (not set)',
          // The Homey Z-Wave proxy uses the raw command-field identifier
          // here (unlike the human-readable names used by Door Lock).
          USER_CODE: userCode,
        });
        this.log(`Updated Homey slot ${slot} in Yale Z-Wave PIN slot ${userId}`);

      } catch (err) {
        this.error(`SLOT ${slot} ERROR`, err);
        throw err;
      }

    }

  }

}

module.exports = YDM3168;
