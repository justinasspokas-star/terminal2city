/*
  Terminal2City — Google Maps / Places configuration

  1) Create a Google Cloud project.
  2) Enable Maps JavaScript API and Places API (New).
  3) Create a browser API key and restrict it to terminal2city.com + www.terminal2city.com.
  4) Paste the key below.

  A browser Maps key is visible in page source by design. Protect it with HTTP referrer
  restrictions and API restrictions in Google Cloud Console.
*/
window.T2C_GOOGLE_MAPS = {
  apiKey: '', // Paste your restricted Google Maps Platform browser API key here.
  region: 'gb',
  language: 'en'
};
