let tempDirectory = process.env['RUNNER_TEMP'] || '';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as semver from 'semver';

const IS_WINDOWS = process.platform === 'win32';

if (!tempDirectory) {
  let baseLocation;
  if (IS_WINDOWS) {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env['USERPROFILE'] || 'C:\\';
  } else {
    if (process.platform === 'darwin') {
      baseLocation = '/Users';
    } else {
      baseLocation = '/home';
    }
  }
  tempDirectory = path.join(baseLocation, 'actions', 'temp');
}

export async function getTitaniumSDK(version: string) {
  const semverVersion: string | null = semver.valid(semver.coerce(
    version
  ) as semver.SemVer);

  if (typeof semverVersion !== 'string') {
    throw Error('Wrong "sdk-version" type');
  }
  let toolPath = tc.find('Titanium', semverVersion);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    let out = '';
    let err = '';

    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          out += data.toString();
        },
        stderr: (data: Buffer) => {
          err += data.toString();
        }
      }
    };

    await exec.exec(
      'npx',
      ['titanium', 'sdk', 'list', '-r', '-o', 'json'],
      options
    );

    if (err) {
      core.error(err);
      throw Error(err);
    }
    const json = JSON.parse(out);

    if (json.installed && json.installed[version]) {
      const sdkPath = json.installed[version];
      core.debug(`SDK version ${version} installed to ${sdkPath}`);
      return;
    }

    if (!json.releases || !json.releases[version]) {
      const err = `SDK version "${version}" not found`;
      core.error(err);
      throw Error(err);
    }
    const url = json.releases[version];
    const sdkFile = await tc.downloadTool(url);
    let tempDir: string = path.join(
      tempDirectory,
      'temp_' + Math.floor(Math.random() * 2000000000)
    );
    await io.mkdirP(tempDir);
    const sdkDir = await tc.extractZip(sdkFile, tempDir);
    core.debug(`SDK extracted to ${sdkDir}`);
    toolPath = await tc.cacheDir(sdkDir, 'Titanium', semverVersion);
  }
  await exec.exec('npx', ['titanium', 'config', 'paths.sdks', '-a', toolPath]);
  core.debug(`exec "titanium config paths.sdks -a ${toolPath}"`);
}
