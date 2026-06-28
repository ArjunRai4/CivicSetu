import type { Strings } from './en'

// Hindi (हिन्दी) — proof-of-concept regional language stub.
const hi: Strings = {
  appName: 'सिविकसेतु',
  tagline: 'एक तस्वीर से कार्रवाई तक।',

  nav: {
    home: 'होम',
    report: 'रिपोर्ट',
    feed: 'फ़ीड',
    impact: 'प्रभाव',
    profile: 'प्रोफ़ाइल',
    dashboard: 'डैशबोर्ड',
    map: 'नक्शा',
    clusters: 'पैटर्न',
    analytics: 'विश्लेषण',
    settings: 'सेटिंग्स',
  },

  viewToggle: {
    label: 'देखें',
    citizen: 'नागरिक',
    authority: 'प्राधिकरण',
  },

  common: {
    back: 'वापस',
    done: 'पूर्ण',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    close: 'बंद करें',
    viewOnMap: 'नक्शे पर देखें',
    viewLetter: 'पत्र देखें',
    readAloud: 'सुनाएँ',
    stop: 'रोकें',
    share: 'साझा करें',
    verify: 'पुष्टि करें',
    flag: 'फ़्लैग करें',
    fileAll: 'सभी दर्ज करें',
    edit: 'संपादित करें',
    loading: 'लोड हो रहा है…',
  },

  report: {
    title: 'समस्या दर्ज करें',
    capture: 'फ़ोटो लें',
    upload: 'अपलोड',
    useDemoPhoto: 'डेमो फ़ोटो',
    voice: 'आवाज़',
    analyzing: 'Gemini विश्लेषण कर रहा है…',
    detected: 'पहचानी गई समस्याएँ',
    predictedImpact: 'अनुमानित प्रभाव',
    worsening: 'बिगड़ने का अनुमान',
  },

  status: {
    REPORTED: 'दर्ज',
    ACKNOWLEDGED: 'स्वीकृत',
    DISPATCHED: 'भेजा गया',
    IN_PROGRESS: 'प्रगति पर',
    RESOLVED: 'हल',
    ESCALATED: 'एस्केलेटेड',
  },

  demoMode: 'डेमो मोड',
}

export default hi
