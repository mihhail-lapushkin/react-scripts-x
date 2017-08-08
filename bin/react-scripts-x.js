#!/usr/bin/env node
'use strict';

const crypto  = require('crypto');
const path    = require('path');
const fs      = require('fs');
const equal   = require('deep-equal');
const spawn   = require('cross-spawn');
const args    = process.argv.slice(2);

const appDirectory            = fs.realpathSync(process.cwd());
const appDescriptor           = require(path.resolve(appDirectory, 'package'));
const extensionsConfig        = appDescriptor['react-scripts-x'];
const reactScriptsDir         = path.dirname(require.resolve('react-scripts/package'));
const reactScriptsDescriptor  = require('react-scripts/package');
const moduleDescriptor        = require('react-scripts-x/package');

const pathTo = {
  webpackDevConfig:           path.resolve(reactScriptsDir, 'config', 'webpack.config.dev.js'),
  webpackProdConfig:          path.resolve(reactScriptsDir, 'config', 'webpack.config.prod.js'),
  webpackDevOriginalConfig:   path.resolve(reactScriptsDir, 'config', 'webpack.config.dev.original.js'),
  webpackProdOriginalConfig:  path.resolve(reactScriptsDir, 'config', 'webpack.config.prod.original.js'),
  changeLog:                  path.resolve(reactScriptsDir, 'react-scripts-x.json')
};

function findArrayEnd(string, start) {
  for (let i = start, bracketDelta = 0; i < string.length; i++) {
    if (string.charAt(i) === '[') {
      bracketDelta++;
    } else if (string.charAt(i) === ']') {
      bracketDelta--;
    }

    if (bracketDelta === 0) {
      return i;
    }
  }

  return -1;
}

function md5(string) {
  const generator = crypto.createHash('md5');
  generator.update(string);
  return generator.digest('hex');
}

function changeAndReturnWebpackConfig(pathToConfig, postcssPlugins) {
  let configContents;

  if (fs.existsSync(pathToConfig + '.original')) {
    configContents = fs.readFileSync(pathToConfig + '.original', 'utf8');
    fs.writeFileSync(pathToConfig, configContents, 'utf8');
  } else {
    configContents = fs.readFileSync(pathToConfig, 'utf8');
    fs.writeFileSync(pathToConfig + '.original', configContents, 'utf8');
  }

  const postcssBlockStart = configContents.indexOf("require.resolve('postcss-loader')");

  if (postcssBlockStart < 0) {
    console.error(`Failed to parse Webpack config: ${pathToConfig}`);
    return configContents;
  }

  const pluginArrayStartString = 'plugins: () => [';
  const pluginArrayStart = configContents.indexOf(pluginArrayStartString, postcssBlockStart);

  if (pluginArrayStart < 0) {
    console.error(`Failed to parse Webpack config: ${pathToConfig}`);
    return configContents;
  }

  const pluginArrayEnd = findArrayEnd(configContents, pluginArrayStart + pluginArrayStartString.length - 1);

  if (pluginArrayEnd < 0) {
    console.error(`Failed to parse Webpack config: ${pathToConfig}`);
    return configContents;
  }

  const changedConfigContents =
    configContents.slice(0, pluginArrayEnd)

    +

    postcssPlugins.map(plugin => {
      if (plugin.config) {
        return `require('${plugin.name}')(${JSON.stringify(plugin.config)})`;
      }

      return `require('${plugin.name}')`;
    }).join()

    +

    configContents.slice(pluginArrayEnd);

  fs.writeFileSync(pathToConfig, changedConfigContents, 'utf8');

  return changedConfigContents;
}

function applyExtensions() {
  console.info('Applying extensions');

  const files = {};

  [
    pathTo.webpackDevConfig,
    pathTo.webpackProdConfig
  ].forEach(file => {
    files[path.relative(reactScriptsDir, file)] = {
      hash: md5(changeAndReturnWebpackConfig(file, extensionsConfig.postcss)),
      changes: extensionsConfig
    };
  });

  fs.writeFileSync(pathTo.changeLog, JSON.stringify({
    version: {
      'react-scripts': reactScriptsDescriptor.version,
      'react-scripts-x': moduleDescriptor.version
    },
    files: files
  }, null, 2), 'utf8');
}

if (extensionsConfig && extensionsConfig.postcss) {
  if (fs.existsSync(pathTo.changeLog)) {
    const changeLog = require(pathTo.changeLog);

    if (changeLog.version['react-scripts'] !== reactScriptsDescriptor.version) {
      applyExtensions();
    } else if (changeLog.version['react-scripts-x'] !== moduleDescriptor.version) {
      applyExtensions();
    } else if (Object.keys(changeLog.files)
        .filter(file => equal(changeLog.files[file].changes, extensionsConfig))
        .filter(file => changeLog.files[file].hash === md5(fs.readFileSync(path.resolve(reactScriptsDir, file), 'utf8')))
        .length !== Object.keys(changeLog.files).length) {
      applyExtensions();
    }
  } else {
    applyExtensions();
  }
}

const result = spawn.sync(
  'node',
  [require.resolve('react-scripts/bin/react-scripts')].concat(args),
  { stdio: 'inherit' }
);

if (result.signal) {
  if (result.signal === 'SIGKILL') {
    console.log(
      'The build failed because the process exited too early. ' +
      'This probably means the system ran out of memory or someone called ' +
      '`kill -9` on the process.'
    );
  } else if (result.signal === 'SIGTERM') {
    console.log(
      'The build failed because the process exited too early. ' +
      'Someone might have called `kill` or `killall`, or the system could ' +
      'be shutting down.'
    );
  }

  process.exit(1);
}

process.exit(result.status);
