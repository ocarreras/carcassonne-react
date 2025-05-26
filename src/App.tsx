import React from 'react'; // Added import
import Game from './components/Game.tsx'
import './App.css'

function App(): React.JSX.Element { // Changed to React.JSX.Element
  return (
    <div className="app-container">
      <Game />
    </div>
  )
}

export default App
