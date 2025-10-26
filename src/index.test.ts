import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createCacheMiddleware } from './index'

function testTask(app: Hono) {
  app.get('/count', async c => {
    var count = await c.var.cache.getIfPresent('count', () => 1)
    await c.var.cache.set('count', count + 1, '10s')
    return c.text(`${count}`)
  })

  app.get('/delete', async c => {
    await c.var.cache.delete('count')
    return c.text('deleted')
  })

  it('Count 1', async () => {
    const req = new Request('http://localhost/count')
    const res = await app.request(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('1')
  })

  it('Count 2', async () => {
    const req = new Request('http://localhost/count')
    const res = await app.request(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('2')
  })

  it('Count delete', async () => {
    const req = new Request('http://localhost/delete')
    const res = await app.request(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('deleted')
  })

  it('Reset Count 1', async () => {
    const req = new Request('http://localhost/count')
    const res = await app.request(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('1')
  })

  it('Count clear', async () => {
    const req = new Request('http://localhost/delete')
    const res = await app.request(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('deleted')
  })
}

describe('Base', async () => {
  const app = new Hono()
  const { cache, cacheMiddleware } = createCacheMiddleware()
  app.use(cacheMiddleware)

  testTask(app)

  await cache.close()
})

// describe('Redis', async () => {
//   const app = new Hono()
//   const { cache, cacheMiddleware } = createCacheMiddleware({
//     redisUrl: 'redis://localhost:6379',
//   })

//   app.use(cacheMiddleware)

//   testTask(app)

//   await cache.close()
// })
