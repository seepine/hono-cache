# hono-cache

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

基于 [Hono](https://hono.dev/) 的中间件，支持内存和 Redis 缓存，以及多级组合。

## 安装

```bash
npm install @seepine/hono-cache
```

## 使用方法

### 1. 注册中间件

```ts
import { Hono } from 'hono'
import { cacheMiddleware } from '@seepine/hono-cache'

const app = new Hono()
app.use(cacheMiddleware())
```

### 2. 使用

```ts
// service/userService.ts

app.get('/userinfo', async c => {
  const userinfo = await c.var.cache.get('key')
  return c.json(userinfo)
})
```

## 方法合集

### get

```ts
c.var.cache.get('key')
```

### set

```ts
c.var.cache.set('key', 'value')
c.var.cache.set('key', 'value', '30s') // 过期时间
```

### getIfPresent

```ts
c.var.cache.getIfPresent(
  'key',
  () => {
    return findById('userId')
  },
  '30s',
)
```

<!-- Refs -->

[npm-version-src]: https://img.shields.io/npm/v/@seepine/hono-cache
[npm-version-href]: https://www.npmjs.com/package/@seepine/hono-cache
[npm-downloads-src]: https://img.shields.io/npm/dm/@seepine/hono-cache
[npm-downloads-href]: https://npmjs.com/package/@seepine/hono-cache
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@seepine/hono-cache
[bundle-href]: https://bundlephobia.com/result?p=@seepine/hono-cache
[license-src]: https://img.shields.io/github/license/seepine/hono-cache.svg
[license-href]: https://github.com/seepine/hono-cache/blob/main/LICENSE
