import React from 'react';
import VideoEditor from './components/VideoEditor/VideoEditor';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Editor</h1>
      </header>
      <main>
        <VideoEditor />
      </main>
    </div>
  );
}

export default App;