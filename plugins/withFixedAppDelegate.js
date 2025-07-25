// plugins/withFixedAppDelegate.js
const { withDangerousMod, WarningAggregator } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// J'ai mis à jour cette fonction
const getAppDelegatePath = (projectRoot) => {
  // On lit le nom du projet depuis app.json
  const appName = require(path.join(projectRoot, 'app.json')).expo.name;
  // Expo "nettoie" le nom pour le dossier natif (ex: "my-app" devient "myapp")
  const sanitizedName = appName.replace(/[-_]/g, ''); // <-- LA MAGIE EST ICI

  const appDelegatePath = path.join(projectRoot, 'ios', sanitizedName, 'AppDelegate.swift');

  console.log(`--- ℹ️  Le plugin cherche maintenant le fichier ici : ${appDelegatePath}`); // Log de débogage
  return appDelegatePath;
};

const withFixedAppDelegate = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      console.log('--- ✅ Exécution du plugin withFixedAppDelegate ---');

      const projectRoot = config.modRequest.projectRoot;
      const appDelegatePath = getAppDelegatePath(projectRoot);

      if (!fs.existsSync(appDelegatePath)) {
        WarningAggregator.addWarningIOS(
          'withFixedAppDelegate',
          `Le plugin n'a TOUJOURS PAS trouvé AppDelegate.swift. Vérifiez que le nom du dossier dans /ios correspond bien à "${getAppDelegatePath(projectRoot)}"`
        );
        return config;
      }

      let content = fs.readFileSync(appDelegatePath, 'utf8');

      const linesToRemove = [
        /^\s*var\s+window:\s*UIWindow\?\s*\n/m,
        /^\s*var\s+reactNativeDelegate:\s*ExpoReactNativeFactoryDelegate\?\s*\n/m,
        /^\s*var\s+reactNativeFactory:\s*RCTReactNativeFactory\?\s*\n/m,
        /^\s*reactNativeDelegate = delegate\s*\n/m,
        /^\s*reactNativeFactory = factory\s*\n/m,
        /^\s*bindReactNativeFactory\(factory\)\s*\n/m,
      ];

      let modified = false;
      for (const lineRegex of linesToRemove) {
        if (lineRegex.test(content)) {
          content = content.replace(lineRegex, '');
          modified = true;
        }
      }

      if (modified) {
        console.log('--- ✅ Les lignes problématiques ont été supprimées de AppDelegate.swift.');
        fs.writeFileSync(appDelegatePath, content);
      } else {
        console.log("--- ℹ️ Aucune ligne problématique à supprimer n'a été trouvée dans AppDelegate.swift.");
      }

      return config;
    },
  ]);
};

module.exports = withFixedAppDelegate;