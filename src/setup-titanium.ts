import * as core from '@actions/core';
import * as installer from './installer';

async function run() {
  try {
    const version = core.getInput('sdk-version', {required: true});
    await installer.getTitaniumSDK(version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
