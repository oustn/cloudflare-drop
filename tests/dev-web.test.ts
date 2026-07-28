import { expect, test } from 'vitest'

import worker from '../src/index'

test('redirects the development web entrypoint to Vite', async () => {
  const response = await worker.fetch(
    new Request('http://127.0.0.1:8790/?code=123456'),
    { ENVIRONMENT: 'dev', SHARE_PORT: '3334' } as Env,
    {} as ExecutionContext,
  )

  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toBe(
    'http://127.0.0.1:3334/?code=123456',
  )
})
