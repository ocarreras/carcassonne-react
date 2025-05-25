import Game from "./components/Game";
import "./App.css";
import NavBar from "./components/NavBar";

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <NavBar />
      <Game />
    </div>
  );
}

export default App;
