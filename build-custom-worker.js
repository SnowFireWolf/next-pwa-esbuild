'use strict'

const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { ESBuildMinifyPlugin } = require('esbuild-loader')

const buildCustomWorker = ({ id, basedir, customWorkerDir, destdir, plugins, success, minify }) => {
  let workerDir = undefined

  if (fs.existsSync(path.join(basedir, customWorkerDir))) {
    workerDir = path.join(basedir, customWorkerDir)
  } else if (fs.existsSync(path.join(basedir, 'src', customWorkerDir))) {
    workerDir = path.join(basedir, 'src', customWorkerDir)
  }

  if (!workerDir) return

  const name = `worker-${id}.js`
  const customWorkerEntries = ['ts', 'js']
    .map(ext => path.join(workerDir, `index.${ext}`))
    .filter(entry => fs.existsSync(entry))

  if (customWorkerEntries.length !== 1) return

  const customWorkerEntry = customWorkerEntries[0]
  console.log(`> [PWA] Custom worker found: ${customWorkerEntry}`)
  console.log(`> [PWA] Build custom worker: ${path.join(destdir, name)}`)
  webpack({
    mode: 'none',
    target: 'webworker',
    entry: {
      main: customWorkerEntry
    },
    resolve: {
      extensions: ['.ts', '.js'],
      fallback: {
        module: false,
        dgram: false,
        dns: false,
        path: false,
        fs: false,
        os: false,
        crypto: false,
        stream: false,
        http2: false,
        net: false,
        tls: false,
        zlib: false,
        child_process: false
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/i,
          loader: 'esbuild-loader',
        },
      ]
    },
    output: {
      path: destdir,
      filename: name
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [path.join(destdir, 'worker-*.js'), path.join(destdir, 'worker-*.js.map')]
      })
    ].concat(plugins),
    optimization: minify
      ? {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin(),
        ]
      }
      : undefined
  }).run((error, status) => {
    if (error || status.hasErrors()) {
      console.error(`> [PWA] Failed to build custom worker`)
      console.error(status.toString({ colors: true }))
      process.exit(-1)
    } else {
      success({ name })
    }
  })
}

module.exports = buildCustomWorker
