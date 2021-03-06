import {
  APP_ID,
  APP_NAME,
  CORDOVA_PLUGIN_ID,
  MappedFS,
  makeAppDir,
  makeConfig,
  run,
  installPlatform,
} from './util';
import { updateCommand } from '../src/tasks/update';

describe.each([false, true])(
  'Update: Android (monoRepoLike: %p)',
  monoRepoLike => {
    let appDirObj: any;
    let appDir: string;
    let FS: MappedFS;

    beforeAll(async () => {
      // These commands are slowww...
      jest.setTimeout(150000);
      appDirObj = await makeAppDir(monoRepoLike);
      appDir = appDirObj.appDir;
      // Init in this directory so we can test add
      await run(appDir, `init "${APP_NAME}" "${APP_ID}"`);
      await installPlatform(appDir, 'android');
      await run(appDir, `add android`);
      // Redundant, because add does this, but called explicitly for thoroughness
      await updateCommand(makeConfig(appDir), 'android', false);
      FS = new MappedFS(appDir);
    });

    afterAll(() => {
      //appDirObj.cleanupCallback();
    });

    it('Should update', async () => {});

    it('Should install Cordova plugin JS', async () => {
      const cordovaPluginJSContent = await FS.read(
        'android/app/src/main/assets/public/cordova_plugins.js',
      );
      let regex = new RegExp(CORDOVA_PLUGIN_ID);
      expect(regex.test(cordovaPluginJSContent)).toBe(true);
    });

    // Other test ideas:
    // should install/copy pre-existing cordova/capacitor plugins in package.json
  },
);
