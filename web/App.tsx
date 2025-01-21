import { useState } from 'preact/hooks'

import { observer } from 'mobx-react-lite'
import { observable, action } from 'mobx'

import preactLogo from './assets/preact.svg'
import viteLogo from '/vite.svg'
import './app.css'

class Counter {
  @observable accessor count = 0

  @action
  update() {
    this.count++
  }
}

const state = new Counter()

function Component() {
  const [counter] = useState<Counter>(state)

  return (
    <>
      <div class="bg-amber-100">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://preactjs.com" target="_blank">
          <img src={preactLogo} class="logo preact" alt="Preact logo" />
        </a>
      </div>
      <h1>Vite + Preact</h1>
      <div class="card">
        <button onClick={() => counter.update()}>Count is {counter.count}</button>
        <p>
          Edit <code>src/app.tsx</code> and save to test HMR
        </p>
      </div>
      <p>
        Check out{' '}
        <a href="https://preactjs.com/guide/v10/getting-started#create-a-vite-powered-preact-app" target="_blank">
          create-preact
        </a>
        , the official Preact + Vite starter
      </p>
      <p class="read-the-docs">Click on the Vite and Preact logos to learn more</p>
    </>
  )
}

export const App = observer(Component)
