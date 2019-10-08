"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let tempDirectory = process.env['RUNNER_TEMP'] || '';
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const IS_WINDOWS = process.platform === 'win32';
if (!tempDirectory) {
    let baseLocation;
    if (IS_WINDOWS) {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    }
    else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        }
        else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}
function getTitaniumSDK(version) {
    return __awaiter(this, void 0, void 0, function* () {
        const semverVersion = semver.valid(semver.coerce(version));
        if (typeof semverVersion !== 'string') {
            throw Error('Wrong "sdk-version" type');
        }
        let toolPath = tc.find('Titanium', semverVersion);
        if (toolPath) {
            core.debug(`Tool found in cache ${toolPath}`);
        }
        else {
            let out = '';
            let err = '';
            const options = {
                listeners: {
                    stdout: (data) => {
                        out += data.toString();
                    },
                    stderr: (data) => {
                        err += data.toString();
                    }
                }
            };
            yield exec.exec('npx', ['titanium', 'sdk', 'list', '-r', '-o', 'json'], options);
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
            const sdkFile = yield tc.downloadTool(url);
            let tempDir = path.join(tempDirectory, 'temp_' + Math.floor(Math.random() * 2000000000));
            yield io.mkdirP(tempDir);
            const sdkDir = yield tc.extractZip(sdkFile, tempDir);
            core.debug(`SDK extracted to ${sdkDir}`);
            toolPath = yield tc.cacheDir(sdkDir, 'Titanium', semverVersion);
        }
        yield exec.exec('npx', ['titanium', 'config', 'paths.sdks', '-a', toolPath]);
        core.debug(`exec "titanium config paths.sdks -a ${toolPath}"`);
    });
}
exports.getTitaniumSDK = getTitaniumSDK;
