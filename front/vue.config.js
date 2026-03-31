const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,

  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      },
      fallback: {
        path: require.resolve('path-browserify'),
        util: require.resolve('util/'),
        stream: require.resolve('stream-browserify'),
        os: require.resolve('os-browserify/browser'),
        fs: false
      }
    }
  },

  css: {
    loaderOptions: {
      scss: {
        additionalData: `@use "@/assets/styles/variables.scss" as *;`
      }
    }
  },

  devServer: {
    port: 8080,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        pathRewrite: { '^/ai': '' }
      }
    }
  }
})