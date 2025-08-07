import VideoEditor from './components/VideoEditor';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Editor</h1>
        <h3>Hi, Yoav! Currently My account is blocked from Upwork, I don't know why this happend.</h3>
        <h4>I am doing appeal now, and maybe I will recover the account sooner, must I can recove the account.</h4>
        <h4>If you have much time to the deadline, we can continue the project out of the platform, but if you are okay for some dealy we can continue in Upwork after my account recovered.</h4>
        <h4>My contract information: Telegram: dmytro7070 Gmail: dmytrokuropiatnykov@gmail.com</h4>
      </header>
      <main>
        <VideoEditor />
      </main>
    </div>
  );
}

export default App;