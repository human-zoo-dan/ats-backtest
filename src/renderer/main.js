import Vue from 'vue'
import axios from 'axios'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'
import Datastore from 'nedb'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import electron from 'electron'
import VueI18n from 'vue-i18n'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueParticles from 'vue-particles'
import lodash from 'lodash'
import VueLodash from 'vue-lodash'
import crypto from 'crypto'
import VueMoment from 'vue-moment'
import moment from 'moment'
import VueHighcharts from 'vue-highcharts'
import Highcharts from 'highcharts'

import App from './App'
import router from './router'
import store from './store'
import messages from './i18n'
import loadStock from 'highcharts/modules/stock'

const app = electron.remote.app;
const userData = app.getPath('userData')
const dir = path.join(userData, '/db')
const algorithm = 'aes256'
const key = 'ats-backtest'

global.rootUrl = 'https://0688tckhoj.execute-api.ap-southeast-1.amazonaws.com/dev'

if (!fs.existsSync(dir)) {
  mkdirp.sync(dir)
}

global.db = new Datastore({
  filename: path.join(dir, '/data'),
  autoload: true,
  // afterSerialization: function (doc) {
  //   // console.log('AFTER SERIALIZATION')
  //   // console.log('A - DOC : ' + doc)
  //   if (isJson(doc)) {
  //     let cipher = crypto.createCipher(algorithm, key);
  //     let encrypted = cipher.update(JSON.stringify(doc), 'utf8', 'hex') + cipher.final('hex');
  //     // console.log("Ser " + encrypted);
  //     return encrypted;
  //   }
  //   return doc;
  // },
  // beforeDeserialization: function (doc) {
  //   // console.log('BEFORE SERIALIZATION')
  //   // console.log('B - DOC : ' + doc)

  //   let decipher = crypto.createDecipher(algorithm, key);

  //   try {
  //     let decrypted = decipher.update(doc, 'hex', 'utf8') + decipher.final('utf8');
  //     // console.log("decipher" + JSON.parse(decrypted));
  //     return JSON.parse(decrypted);
  //   } catch (e) {
  //     // console.log('Catched error ' + doc)
  //     return doc
  //   }
  // }
})

Vue.use(Vuetify, {
  theme: {
    primary: 'green',
  }
})
Vue.use(VueI18n)
Vue.use(ElementUI)
Vue.use(VueParticles)
Vue.use(VueMoment)
global.moment = moment
Vue.use(VueLodash, lodash)
global._ = lodash

loadStock(Highcharts)
Vue.use(VueHighcharts, {
  Highcharts
})
Highcharts.setOptions({
  global: {
    useUTC: false
}
})

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: 'en', // set locale
  messages, // set locale messages
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
global.router = router
global.store = store

/* eslint-disable no-new */
new Vue({
  components: {
    App
  },
  router,
  store,
  template: '<App/>',
  i18n
}).$mount('#app')


function isJson(item) {
  item = typeof item !== "string" ?
    JSON.stringify(item) :
    item;

  try {
    item = JSON.parse(item);
  } catch (e) {
    return false;
  }

  if (typeof item === "object" && item !== null) {
    return true;
  }

  return false;
}

global.backtest = {
conditionString(indicator){
  let text=''
  text+=backtest.compareString(indicator.compare1,indicator.param1)

  switch(indicator.condition){
      case '^':
      text+=' cross above '
      break
      case 'v':
      text+=' cross under '
      break
      case '>':
      text+=' greater than '
      break
      case '<':
      text+=' small than '
      break
  }
  text+=backtest.compareString(indicator.compare2,indicator.param2)
  return text
},
compareString(v,param){
  switch(v){
      case 'close':
      return 'Close price'
      break
      case 'ma_fast':
      return 'MA fast('+param+')'
      case 'ma_slow':
      return 'MA slow('+param+')'
      break
  }
}
}

Vue.prototype.$locale = {
  change(lang) {
    i18n.locale = lang
  },
  current() {
    return i18n.locale
  }
}

Vue.prototype.$time={
  minimize(m){
    if(m>=1440){
      return m/1440+' day(s)'
    }else if(m>=60){
      return m/60+' hour(s)'
    }else{
      return m+' min(s)'
    }
  }
}

Vue.prototype.$rgb = {
  hsl_col_perc(percent, start, end) {
    let a = percent / 100,
      b = end * a
    const c = b + start
    //Return a CSS HSL string
    return 'hsl(' + c + ',100%,50%)' //green to red
  },
  hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}

Vue.prototype.$math = {
  stdev(arr) {
    let n = arr.length;
    let sum = 0;

    arr.map(function (data) {
      sum += data;
    });

    let mean = sum / n;

    let letiance = 0.0;
    let v1 = 0.0;
    let v2 = 0.0;

    if (n != 1) {
      for (let i = 0; i < n; i++) {
        v1 = v1 + (arr[i] - mean) * (arr[i] - mean);
        v2 = v2 + (arr[i] - mean);
      }

      v2 = v2 * v2 / n;
      letiance = (v1 - v2) / (n - 1);
      if (letiance < 0) {
        letiance = 0;
      }
      stddev = Math.sqrt(letiance);
    }

    return {
      mean: Math.round(mean * 100) / 100,
      letiance: letiance,
      deviation: Math.round(stddev * 100) / 100
    };
  }
}

Vue.prototype.$array = {
  move(arr, old_index, new_index) {
    while (old_index < 0) {
      old_index += arr.length;
    }
    while (new_index < 0) {
      new_index += arr.length;
    }
    if (new_index >= arr.length) {
      var k = new_index - arr.length;
      while ((k--) + 1) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  }
}
