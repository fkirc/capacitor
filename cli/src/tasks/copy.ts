import c from '../colors';
import { Config } from '../config';
import {
  checkWebDir,
  logFatal,
  resolveNode,
  resolvePlatform,
  runPlatformHook,
  runTask,
} from '../common';
import { existsAsync } from '../util/fs';
import { allSerial } from '../util/promise';
import { copyWeb } from '../web/copy';
import { basename, join, relative, resolve } from 'path';
import { copy as fsCopy, remove } from 'fs-extra';
import {
  getCordovaPlugins,
  handleCordovaPluginsJS,
  writeCordovaAndroidManifest,
} from '../cordova';
import { logger } from '../log';

export async function copyCommand(
  config: Config,
  selectedPlatformName: string,
) {
  if (selectedPlatformName && !config.isValidPlatform(selectedPlatformName)) {
    const platformDir = resolvePlatform(config, selectedPlatformName);
    if (platformDir) {
      await runPlatformHook(platformDir, 'capacitor:copy');
    } else {
      logger.error(`Platform ${c.input(selectedPlatformName)} not found.`);
    }
  } else {
    const platforms = config.selectPlatforms(selectedPlatformName);
    if (platforms.length === 0) {
      logger.info(
        `There are no platforms to copy yet.\n` +
          `Add platforms with ${c.input('npx cap add')}.`,
      );
      return;
    }
    try {
      await allSerial(
        platforms.map(platformName => () => copy(config, platformName)),
      );
    } catch (e) {
      logger.error(e.stack ?? e);
    }
  }
}

export async function copy(config: Config, platformName: string) {
  await runTask(c.success(c.strong(`copy ${platformName}`)), async () => {
    const result = await checkWebDir(config);
    if (result) {
      throw result;
    }

    if (platformName === config.ios.name) {
      await copyWebDir(config, config.ios.webDirAbs);
      await copyNativeBridge(config, config.ios.webDirAbs);
      await copyCapacitorConfig(
        config,
        join(
          config.ios.platformDir,
          config.ios.nativeProjectName,
          config.ios.nativeProjectName,
        ),
      );
      const cordovaPlugins = await getCordovaPlugins(config, platformName);
      await handleCordovaPluginsJS(cordovaPlugins, config, platformName);
    } else if (platformName === config.android.name) {
      await copyWebDir(config, config.android.webDirAbs);
      await copyNativeBridge(config, config.android.webDirAbs);
      await copyCapacitorConfig(
        config,
        join(config.android.platformDir, 'app/src/main/assets'),
      );
      const cordovaPlugins = await getCordovaPlugins(config, platformName);
      await handleCordovaPluginsJS(cordovaPlugins, config, platformName);
      await writeCordovaAndroidManifest(cordovaPlugins, config, platformName);
    } else if (platformName === config.web.name) {
      await copyWeb(config);
    } else {
      throw `Platform ${platformName} is not valid.`;
    }
  });
}

async function copyNativeBridge(config: Config, nativeAbsDir: string) {
  const nativeRelDir = relative(config.app.rootDir, nativeAbsDir);
  let bridgePath = resolveNode(config, '@capacitor/core', 'native-bridge.js');
  if (!bridgePath) {
    logFatal(
      `Unable to find node_modules/@capacitor/core/native-bridge.js.\n` +
        `Are you sure ${c.strong('@capacitor/core')} is installed?`,
    );
  }

  await runTask(
    `Copying ${c.strong('native-bridge.js')} to ${nativeRelDir}`,
    async () => {
      return fsCopy(bridgePath!, join(nativeAbsDir, 'native-bridge.js'));
    },
  );
}

async function copyCapacitorConfig(config: Config, nativeAbsDir: string) {
  const nativeRelDir = relative(config.app.rootDir, nativeAbsDir);
  const configPath = resolve(config.app.extConfigFilePath);
  if (!(await existsAsync(configPath))) {
    return;
  }

  await runTask(
    `Copying ${c.strong('capacitor.config.json')} to ${nativeRelDir}`,
    async () => {
      return fsCopy(configPath, join(nativeAbsDir, 'capacitor.config.json'));
    },
  );
}

async function copyWebDir(config: Config, nativeAbsDir: string) {
  const webAbsDir = config.app.webDirAbs;
  const webRelDir = basename(webAbsDir);
  const nativeRelDir = relative(config.app.rootDir, nativeAbsDir);

  await runTask(
    `Copying web assets from ${c.strong(webRelDir)} to ${nativeRelDir}`,
    async () => {
      await remove(nativeAbsDir);
      return fsCopy(webAbsDir, nativeAbsDir);
    },
  );
}
