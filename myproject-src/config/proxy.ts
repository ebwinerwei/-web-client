/**
 * 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 */
export default {
  dev: {
    '/api': {
      //target: 'https://www.znzme.com',
      // target: 'https://www.ai-designs.jp',
      target: 'https://www.ai-designpro.com',
      // target: 'http://60.204.221.238:81',
      changeOrigin: true,
      secure:false,
      pathRewrite: { '^/api': '' },
    },
    '/prompt': {
      //target: 'https://u296544-a25b-b5150a6d.bjb1.seetacloud.com:8443',
      //dev
      target: 'https://u449109-bfa5-d47313d0.westb.seetacloud.com:8443/',
      // honnban
      // target: 'https://u449109-9ea0-7e770d71.westc.gpuhub.com:8443/',
      
      changeOrigin: true,
      pathRewrite: { '^/prompt': '/prompt' },
    },
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    // '/image': {
    //   // 要代理的地址
    //   // target: 'http://43.143.32.187:1234',
    //   target: 'http://127.0.0.1:8188',
    //   // 配置了这个可以从 http 代理到 https
    //   // 依赖 origin 的功能可能需要这个，比如 cookie
    //   changeOrigin: true,
    // },
  },
  test: {
    '/test': {
      target: 'http//ph5qj7.natappfree.cc',
      changeOrigin: true,
      pathRewrite: { '^/test': '/test' },
    },
  },
  pre: {
    '/test': {
      target: 'http//ph5qj7.natappfree.cc',
      changeOrigin: true,
      pathRewrite: { '^/test': '/test' },
    },
  },
};
