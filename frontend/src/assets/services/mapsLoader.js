import { getMapConfig } from "./api";

let loadPromise = null;

export const loadGoogleMaps = () => {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    getMapConfig()
      .then((response) => {
        const apiKey = response.data?.apiKey || "";
        if (!apiKey) {
          reject(new Error("Google Maps API key not found in configuration"));
          return;
        }

        const callbackName = "initGoogleMapsCallback";
        window[callbackName] = () => {
          resolve(window.google);
          delete window[callbackName];
        };

        const existingScript = document.getElementById("google-maps-script");
        if (existingScript) {
          if (window.google && window.google.maps) {
            resolve(window.google);
          } else {
            // Wait for existing script to trigger window callback
            const originalCallback = window[callbackName];
            window[callbackName] = () => {
              if (originalCallback) originalCallback();
              resolve(window.google);
            };
          }
          return;
        }

        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.onerror = (err) => {
          loadPromise = null;
          reject(err);
        };
        document.body.appendChild(script);
      })
      .catch((err) => {
        loadPromise = null;
        reject(err);
      });
  });

  return loadPromise;
};
