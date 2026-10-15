import { SketchCanvas } from './components/SketchCanvas';
import { Preview3D } from './components/Preview3D';
import { ControlPanel } from './components/ControlPanel';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Frame Studio</h1>
        <p>Sketch your own eyewear frame and watch it become a real 3D model.</p>
      </header>
      <div className="app-body">
        <aside className="app-panel">
          <ControlPanel />
        </aside>
        <main className="app-split">
          <div className="split-pane split-pane-2d">
            <SketchCanvas />
          </div>
          <div className="split-pane split-pane-3d">
            <Preview3D />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
